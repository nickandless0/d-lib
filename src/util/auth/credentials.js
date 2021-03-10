/*
  Credentials Factory
*/
import { ec as EC } from 'elliptic'
import { SimpleSigner } from '../jwt/simple'
import { createJWT, verifyJWT } from '../jwt'
import { toEthereumAddress } from '../jwt/digest'
import { register } from '../did'
import { ContractFactory } from './contract.js'

const secp256k1 = new EC('secp256k1')

const Types = {
  DISCLOSURE_REQUEST: 'shareReq',
  DISCLOSURE_RESPONSE: 'shareResp',
  TYPED_DATA_SIGNATURE_REQUEST: 'eip712Req',
  VERIFICATION_SIGNATURE_REQUEST: 'verReq',
  ETH_TX_REQUEST: 'ethtx',
  PERSONAL_SIGN_REQUEST: 'personalSigReq'
}

// const toSeconds = date => Math.floor(date / 1000)

export class Credentials {

  constructor({ did, address, privateKey, signer, registry, provider } = {}) {
    if (signer) {
      this.signer = signer
    } else if (privateKey) {
      this.signer = SimpleSigner(privateKey)
    }

    if (did) {
      this.did = did
    } else if (address) {
      if (address.match('^0x[0-9a-fA-F]{40}$')) {
        this.did = `did:d:${address}`
      }
    } else if (privateKey) {
      const kp = secp256k1.keyFromPrivate(privateKey)
      const address = toEthereumAddress(kp.getPublic('hex'))
      this.did = `did:d:${address}`
    }

    this.signJWT = (payload, expiresIn) =>
      createJWT(payload, {
        issuer: this.did,
        signer: this.signer,
        alg: 'ES256K-R',
        expiresIn,
      })

    register({ provider, registry })

  }

  static createIdentity(method) {
    const kp = secp256k1.genKeyPair()
    const publicKey = kp.getPublic('hex')
    const privateKey = kp.getPrivate('hex')
    const address = toEthereumAddress(publicKey)
    const did = `did:${method}:${address}`
    return { did, address, publicKey, privateKey }
  }

  static recoverIdentity(recover) {
    const did = `did:d${recover.signingKey.address}`
    const address = recover.signingKey.address
    const publicKey = recover.signingKey.publicKey
    const privateKey = recover.signingKey.privateKey
    return { did, address, publicKey, privateKey }
  }

  createDisclosureRequest(params = {}, expiresIn = 600) {
    const payload = {}
    if (params.requested) payload.requested = params.requested
    if (params.sub) payload.sub = params.sub
    if (params.verified) payload.verified = params.verified
    if (params.notifications) payload.permissions = ['notifications']
    if (params.callbackUrl) payload.callback = params.callbackUrl
    if (params.networkId) payload.net = params.networkId
    if (params.rpcUrl) {
      if (params.networkId) {
        payload.rpc = params.rpcUrl
      } else {
        return Promise.reject(new Error(`rpcUrl was specified but no networkId`))
      }
    }
    if (params.vc) payload.vc = params.vc
    if (params.exp) payload.exp = params.exp

    if (params.accountType) {
      if (['general', 'segregated', 'keypair', 'none'].indexOf(params.accountType) >= 0) {
        payload.act = params.accountType
      } else {
        return Promise.reject(new Error(`Unsupported accountType ${params.accountType}`))
      }
    }

    return this.signJWT({ ...payload, type: Types.DISCLOSURE_REQUEST }, params.exp ? undefined : expiresIn)
  }

  createVerification({ sub, claim, exp, vc, callbackUrl }) {
    return this.signJWT({ sub, claim, exp, vc, callbackUrl })
  }

  createVerificationSignatureRequest(unsignedClaim, { aud, sub, riss, callbackUrl, vc, expiresIn} = {}) {
    return this.signJWT({
      unsignedClaim,
      sub,
      riss,
      aud,
      vc,
      callback: callbackUrl,
      type: Types.VERIFICATION_SIGNATURE_REQUEST,
    }, expiresIn)
  }

  createTypedDataSignatureRequest(typedData, {from, net, callback} = {}) {
    for (const prop of ['types', 'primaryType', 'message', 'domain']) { 
      if (!typedData[prop]) throw new Error(`Invalid EIP712 Request, must include ${prop}`)
    }
    return this.signJWT({typedData, from, net, callback, type: Types.TYPED_DATA_SIGNATURE_REQUEST})
  }

  createPersonalSignRequest(data, {from, net, callback} = {}) {
    return this.signJWT({data, from, net, callback, type: Types.PERSONAL_SIGN_REQUEST})
  }

  createTxRequest(txObj, { callbackUrl, exp = 600, networkId, label } = {}) {
    const payload = {}
    if (callbackUrl) payload.callback = callbackUrl
    if (networkId) payload.net = networkId
    if (label) payload.label = label
    return this.signJWT({ ...payload, ...txObj, type: Types.ETH_TX_REQUEST }, exp)
  }

  async createDisclosureResponse(payload = {}, expiresIn = 600) {
    if (payload.req) {
      const verified = await verifyJWT(payload.req)
      if (verified.issuer) {
        payload.aud = verified.issuer
      }
      if (verified.payload.sub) {
        payload.sub = verified.payload.sub
      }
    }
    return this.signJWT({ ...payload, type: Types.DISCLOSURE_RESPONSE }, expiresIn)
  }

  async processDisclosurePayload({ doc, payload }) {

    const { 
      own={}, 
      capabilities=[], 
      type, 
      nad: mnid, 
      dad: deviceKey, 
      iss: did, 
      publicKey, 
      verified, 
      ...rest 
    } = payload

    const { 
      profile={} 
    } = doc

    const processed = {
      did,
      publicKey,
      ...own,
      ...profile, 
      ...rest
    }
    
    if (deviceKey) processed.deviceKey = deviceKey

    if (capabilities.length === 1) {
      processed.pushToken = capabilities[0]
    } 

    if (verified) {
      const invalid = []
      const verifying = verified.map(token => verifyJWT(token, {audience: this.did}).catch(() => {
        invalid.push(token)
        return Promise.resolve(null)
      }))

      // remove invalid JWTs
      processed.verified = (await Promise.all(verifying))
        .map(v => v ? ({...v.payload, jwt: v.jwt}) : null)
        .reduce((list, item) => item ? [...list, item] : list, [])

      processed.invalid = invalid
    }

    return processed
  }

  async authenticateDisclosureResponse(token, callbackUrl = null) {
    const { payload, doc } = await verifyJWT(token, {
      audience: this.did,
      callbackUrl,
      auth: true,
    })

    if (payload.req) {
      const challenge = await verifyJWT(payload.req)
      if (challenge.payload.iss !== this.did) {
        throw new Error(`Challenge issuer does not match current identity: ${challenge.payload.iss} !== ${this.did}`)
      } else if (challenge.payload.type !== Types.DISCLOSURE_REQUEST) {
        throw new Error(`Challenge payload type invalid: ${challenge.payload.type}`)
      } else {
        return this.processDisclosurePayload({ payload, doc })
      }
    } else {
      throw new Error('Challenge was not included in response')
    }
  }

  async verifyDisclosure(token) {
    const { payload, doc } = await verifyJWT(token, { audience: this.did })
    return this.processDisclosurePayload({ payload, doc })
  }

  contract(abi) {
    const txObjHandler = (txObj, opts) => {
      if (txObj.function) txObj.fn = txObj.function
      delete txObj['function']
      return this.createTxRequest(txObj, opts)
    }
    return ContractFactory(txObjHandler.bind(this))(abi)
  }
}

const configNetworks = nets => {
  Object.keys(nets).forEach(key => {
    const net = nets[key]
    if (typeof net === 'object') {
      ['registry', 'rpcUrl'].forEach(key => {
        if (!net.hasOwnProperty(key))
          throw new Error(`Malformed network config object, object must have '${key}' key specified.`)
      })
    } else {
      throw new Error(`Network configuration object required`)
    }
  })
  return nets
}


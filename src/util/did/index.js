/* 
  Decentralized Identity Document (DID)
*/
import { registerMethod } from '../resolver'
import HttpProvider from 'ethjs-provider-http'
import Eth from 'ethjs-query'
import abi from 'ethjs-abi'
import BN from 'bn.js'
import EthContract from 'ethjs-contract'
import { Buffer } from 'buffer'

import DelegateContract from '../../../contracts/build/contracts/Delegate.json'

export function bytes32toString(bytes32) {
  return Buffer.from(bytes32.slice(2), 'hex')
    .toString('utf8')
    .replace(/\0+$/, '')
}

export function stringToBytes32(str) {
  const buffstr =
    '0x' +
    Buffer.from(str)
      .slice(0, 32)
      .toString('hex')
  return buffstr + '0'.repeat(66 - buffstr.length)
}

export const delegateTypes = {
  Secp256k1SignatureAuthentication2018: stringToBytes32('sigAuth'),
  Secp256k1VerificationKey2018: stringToBytes32('veriKey'),
}

export const attrTypes = {
  sigAuth: 'SignatureAuthentication2018',
  veriKey: 'VerificationKey2018',
}

function wrapDidDocument(did, owner, history) {
  const now = new BN(Math.floor(new Date().getTime() / 1000))
  const expires = Math.floor(
    (new Date().getTime() + 24 * 60 * 60 * 1000) / 1000
  )
  const publicKey = [
    {
      id: `${did}#owner`,
      type: 'Secp256k1VerificationKey2018',
      owner: did,
      ethereumAddress: owner,
      expires,
    },
  ]

  const authentication = [
    {
      type: 'Secp256k1SignatureAuthentication2018',
      publicKey: `${did}#owner`,
    },
  ]

  let delegateCount = 0

  const auth = {}
  const pks = {}
  const services = {}

  for (const event of history) {
    const validTo = event.validTo
    const key = `${event._eventName}-${event.delegateType ||
      event.name}-${event.delegate || event.value}`
    if (validTo && validTo.gte(now)) {
      if (event._eventName === 'DIDDelegateChanged') {
        delegateCount++
        const delegateType = bytes32toString(event.delegateType)
        switch (delegateType) {
        case 'sigAuth':
          auth[key] = {
            type: 'Secp256k1SignatureAuthentication2018',
            publicKey: `${did}#delegate-${delegateCount}`,
          }
          break
        case 'veriKey':
          pks[key] = {
            id: `${did}#delegate-${delegateCount}`,
            type: 'Secp256k1VerificationKey2018',
            owner: did,
            ethereumAddress: event.delegate,
          }
          break
        }
      } else if (event._eventName === 'DIDAttributeChanged') {
        const name = bytes32toString(event.name)
        const match = name.match(
          /^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/
        )
        if (match) {
          const section = match[1]
          const algo = match[2]
          const type = attrTypes[match[4]] || match[4]
          const encoding = match[6]

          switch (section) {
          case 'pub': {
            delegateCount++
            const pk = {
              id: `${did}#delegate-${delegateCount}`,
              type: `${algo}${type}`,
              owner: did,
            }

            switch (encoding) {
            case null:
            case undefined:
            case 'hex': {
              pk.publicKeyHex = event.value.slice(2)
              break
            }
            case 'base64': {
              pk.publicKeyBase64 = Buffer.from(
                event.value.slice(2),
                'hex'
              ).toString('base64')
              break
            }
            case 'base58': {
              pk.publicKeyBase58 = Buffer.from(
                event.value.slice(2),
                'hex'
              ).toString('base58')
              break
            }
            case 'pem': {
              pk.publicKeyPem = Buffer.from(
                event.value.slice(2),
                'hex'
              ).toString()
              break
            }
            default: {
              pk.value = event.value
            }
            }

            pks[key] = pk

            break
          }
          case 'svc': {
            services[key] = {
              type: algo,
              serviceEndpoint: Buffer.from(
                event.value.slice(2),
                'hex'
              ).toString(),
            }
            break
          }
          }

        }
      }
    } else {
      if (
        delegateCount > 0 &&
        (event._eventName === 'DIDDelegateChanged' ||
          (event._eventName === 'DIDAttributeChanged' &&
            bytes32toString(event.name).match(/^did\/pub\//))) &&
        validTo.lt(now)
      )
        delegateCount--
      delete auth[key]
      delete pks[key]
      delete services[key]
    }
  }

  const doc = {
    '@context': 'https://w3id.org/did/v1',
    id: did,
    publicKey: publicKey.concat(Object.values(pks)),
    authentication: authentication.concat(Object.values(auth)),
  }
  
  if (Object.values(services).length > 0) {
    doc.service = Object.values(services)
  }

  return doc
}

function configureProvider(conf = {}) {
  if (conf.provider) {
    return conf.provider
  } else if (conf.web3) {
    return conf.web3.currentProvider
  } else {
    return new HttpProvider(
      conf.rpcUrl ||
        'https://rinkeby.infura.io/v3/3e123f97bccd4f09888b27ee35c6b15a'
    )
  }
}

export function register(conf = {}) {
  const provider = configureProvider(conf)
  const eth = new Eth(provider)
  const registryAddress =
    conf.registry || '0x222e481a92e628730ae47ab299caabac0bb644d1'
  const DidReg = new EthContract(eth)(DelegateContract.abi)
  const didReg = DidReg.at(registryAddress)
  const logDecoder = abi.logDecoder(DelegateContract.abi, false)

  const lastChanged = async (identity) => {
    const result = await didReg.changed(identity)
    if (result) {
      return result['0']
    }
  }

  async function changeLog(identity) {
    const history = []
    let previousChange = await lastChanged(identity)

    while (previousChange) {
      const blockNumber = previousChange
      const logs = await eth.getLogs({
        address: registryAddress,
        topics: [null, `0x000000000000000000000000${identity.slice(2)}`],
        fromBlock: previousChange,
        toBlock: previousChange,
      })
      const events = logDecoder(logs)
      previousChange = undefined
      for (const event of events) {
        history.unshift(event)
        if (event.previousChange.lt(blockNumber)) {
          previousChange = event.previousChange
        }
      }
    }
    return history
  }

  async function resolve(did, parsed) {
    if (!parsed.id.match(/^0x[0-9a-fA-F]{40}$/))
      throw new Error(`Not a valid DID: ${did}`)
    const owner = await didReg.identityOwner(parsed.id)
    const history = await changeLog(parsed.id)
    return wrapDidDocument(did, owner['0'], history)
  }

  registerMethod('d', resolve)
}

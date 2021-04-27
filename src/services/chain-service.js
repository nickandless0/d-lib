/// ChainService
const AliasRegistryContract = require('./../../contracts/build/contracts/AliasRegistry.json')
const IdentityRegistryContract = require('./../../contracts/build/contracts/IdentityRegistry.json')
const DelegateContract = require('./../../contracts/build/contracts/Delegate.json')
// const BigNumber = require('bignumber.js')

import { resolve } from '../util/resolver'
import { register } from '../util/did'
import { Credentials } from '../util/auth'

import Web3 from 'web3'
import qr from 'qr-image'

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

const ethers = require('ethers')

let web3Provider
const appendSlash = url => {
  return url.substr(-1) === '/' ? url : url + '/'
}

export default class ChainService {
  constructor({
    apiServer,
    fetch,
    web3,
    options
  } = {}) {
    this.apiServer = apiServer
    this.fetch = fetch
    this.ethers = ethers
    this.options = options
    
    const externalWeb3 = web3 || window.web3
    if (!externalWeb3) {
      throw new Error(
        'web3 is a required option.'
      )
    } else {
      this.web3 = new Web3(externalWeb3.currentProvider)
      web3Provider = new Web3.providers.HttpProvider(this.web3.eth.currentProvider.host)
    }

    const contracts = Object.assign({
      AliasRegistryContract,
      IdentityRegistryContract,
      DelegateContract
    })

    this.contracts = {}

    for (const name in contracts) {
      this.contracts[name] = contracts[name]
      try {
        this.contracts[name].networks = Object.assign(
          {},
          this.contracts[name].networks
        )
      } catch (e) {
        console.log(e)
      }
    }

    this.setDIDRegistry()

    this.responseToClass = async (resp = {}) => {
      return {
        resp
      }
    }
    
  }

  async getQRCodeURI(data) {
    const pngBuffer = qr.imageSync(data, { type: 'png' })
    return 'data:image/png;charset=utf-8;base64, ' + pngBuffer.toString('base64')
  }

  async getProvider() {
    return new ethers.providers.Web3Provider(web3Provider)
    // return new ethers.providers.Web3Provider(this.web3.eth.currentProvider)
  }

  async setProvider(network) {
    return ethers.getDefaultProvider(network)
  }

  async setDIDRegistry() {
    const didRegistry = new ethers.Contract(
      this.contracts.DelegateContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.DelegateContract.abi,
      await this.getProvider()
    )
    //  console.log(didRegistry.address)
    register({ provider: web3Provider, registry: didRegistry.address })
  }
  
  async newWallet(provider) {
    const r = ethers.Wallet.createRandom()
    return new ethers.Wallet(r.privateKey, provider)
  }

  async getWallet(pk, provider) {
    return new ethers.Wallet(pk, provider)
  }

  async setInstance(contract, signer) {
    const factory = new ethers.ContractFactory(contract.abi, contract.bytecode, signer)
    const c = await factory.deploy()    
    return await c.deployed()
  }

  async getInstance(address, contract, provider, signer) {
    const instance = new ethers.Contract(address, contract.abi, provider)
    return instance.connect(signer)
  }

  /// Issuer
  async defaultIssuer(provider) {
    if (!this.options.pk) 
      throw Error('missing key')
    return await this.getWallet(this.options.pk, provider)
  }

  /// Identity
  async setIdentity(identity, store, provider) {

    const owner = await this.defaultIssuer(provider)
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )  
      
    const signer = aliasRegistryDeployed.connect(owner)

    const isIdentity = await aliasRegistryDeployed.isIdentity(identity)

    if (!isIdentity) {
      const tx = await signer.setIdentity(
        identity,
        store,
        true,
        {
          gasPrice: ethers.utils.parseUnits('66', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }
      )
    
      await tx.wait()

      // const did = `did:d:${identity}`
      // console.log(await this.getDocument(did))

      return tx.hash

    } else {
      return '0x0'
    }

  }

  async getIdentity(identity, provider) {
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )
    const isIdentity = await aliasRegistryDeployed.isIdentity(identity)    
    if (!isIdentity) {
      return false
    } else {
      return await aliasRegistryDeployed.getIdentity(identity)
    }
    
  }

  async sendNotification({ title, body, data, to }) {

    const start = Date.now()
    const response = await this.post(
      'v1/push/send',
      {
        notification: {
          title,
          body,
          data
        },
        to
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async sendCallback({ body, data, to }) {

    const start = Date.now()
    const response = await this.post(
      'v1/push/callback',
      {
        notification: {
          title: 'Authorization',
          body,
          data
        },
        to
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async serviceRequest(payload) {
    const start = Date.now()
    const response = await this.post(
      'v1/service',
      { payload },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async reset({ email }) {
    const start = Date.now()
    const response = await this.post(
      'v2/identity/reset',
      {
        email
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async setIdentityActive(identity, active, provider) {

    const owner = await this.defaultIssuer(provider)
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )  

    const signer = aliasRegistryDeployed.connect(owner)

    const isIdentity = await aliasRegistryDeployed.isIdentity(identity)

    if (!isIdentity) {

      return false

    } else {

      const tx = await signer.setIdentityActive(
        identity,
        active,
        // { gasLimit: new BigNumber(3000000) }
      )
    
      await tx.wait()
      
      return tx.hash

    }
  }

  async updateIdentityStore({ identity, hash }) {
    const start = Date.now()
    const response = await this.post(
      'v2/identity/update',
      {
        identity,
        hash
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async loginIdentity({ username }) {
    const start = Date.now()
    const response = await this.post(
      'v2/identity/login',
      {
        username
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async logoutIdentity({ username, active }) {
    const start = Date.now()
    const response = await this.post(
      'v2/identity/logout',
      {
        username,
        active
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  /// Attestations
  async assetVerify({ identity, metadata }) {
    const start = Date.now()
    const response =  await this.post(
      'v2/attestations/asset',
      {
        identity,
        metadata
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async phoneGenerateCode({ number, countryCode }) {
    return await this.post('chain/phone/code', { number: number, countryCode: countryCode })
  }

  async phoneVerify({ identity, metadata }) {
    const start = Date.now()
    const response = await this.post(
      'chain/phone/verify',
      {
        identity,
        metadata
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async emailGenerateCode({ identity, email }) {
    return await this.post('v2/attestations/email/code', { identity: identity, email: email})
  }

  async emailVerify({ identity, metadata }) {
    const start = Date.now()
    const response = await this.post(
      'v2/attestations/email/verify',
      {
        identity,
        metadata
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  /// Assets
  async setAsset({ asset, wallet, hash }) {
    const start = Date.now()
    const response = await this.post(
      'v2/asset/set',
      {
        asset,
        wallet,
        hash
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async getAsset({ store, wallet }) {
    const start = Date.now()
    const response = await this.post(
      'v2/asset/get',
      {
        store,
        wallet
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async getDomain({ domain, isInstitutional }) {
    const start = Date.now()
    const response = await this.post(
      'v2/asset/domain',
      {
        domain,
        isInstitutional
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  async updateAssetStore({ assetId, wallet, hash }) {
    const start = Date.now()
    const response = await this.post(
      'v2/asset/update',
      {
        assetId,
        wallet,
        hash
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  /// Share
  async shareAsset({ wallet, metadata }) {
    const start = Date.now()
    const response = await this.post(
      'v2/share/send',
      {
        wallet,
        metadata
      },
      this.responseToClass
    )
    response.elapsed = (Date.now() - start) + ' ms'
    return response
  }

  /// Helpers
  async http(baseUrl, url, body, successFn, method) {
    const response = await this.fetch(appendSlash(baseUrl) + url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'content-type': 'application/json' },
      credentials: 'include'
    })
    const json = await response.json()
    if (response.ok) {
      return successFn ? successFn(json) : json
    }
    return Promise.reject(JSON.stringify(json))
  }

  async post(url, body, successFn) {
    return await this.http(this.apiServer, url, body, successFn, 'POST')
  }

  async get(url, parameters, successFn) {
    const objectKeys = Object.keys(parameters)
    let stringParams = objectKeys
      .map(key => key + '=' + parameters[key])
      .join('&')

    stringParams = (objectKeys.length === 0 ? '' : '?') + stringParams

    return await this.http(
      this.apiServer,
      url + stringParams,
      undefined,
      successFn,
      'GET'
    )
  }

  async createIdentity(method) {
    const {did, address, publicKey, privateKey} = await new Credentials.createIdentity(method)
    return ({did, address, publicKey, privateKey}) 
  }
  // need to refactor for vuln-sec-0225
  async recoverIdentity(recover) {
    const {did, address, publicKey, privateKey} = await new Credentials.recoverIdentity(recover)
    return ({did, address, publicKey, privateKey}) 
  }

  async getDocument(did) {
    const didRegistry = new ethers.Contract(
      this.contracts.DelegateContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.DelegateContract.abi,
      await this.getProvider()
    )
    register({ provider: web3Provider, registry: didRegistry.address })
    return await resolve(did)
  }  

  async getCredentials(appName, did, privateKey) {
    return await new Credentials({ appName, did, privateKey })
  }  

  async createRequest(creds, payload = {}) {
    return await creds.createDisclosureRequest(payload)
  }

  async createShareResponse (creds, requested, payload = {}) {
    const req = await creds.createDisclosureRequest(requested)
    payload.req = req
    return await creds.createDisclosureResponse(payload)
  }

  async createResponse(creds, payload = {}) {
    return await creds.createDisclosureResponse(payload)
  }

  async authenticateResponse(creds, token) {
    return await creds.authenticateDisclosureResponse(token)
  }

  async createVerifiedShareResponse(creds, requested = {}, payload = {}, own = {}) {
    const req = await creds.createDisclosureRequest(requested)
    const attestation = await creds.createVerification(payload)
    return await creds.createDisclosureResponse({own, verified: [attestation], req})
  }

  async verify(creds, token) {
    return await creds.verifyDisclosure(token)
  }

  async setIdentityStore(identity, store, provider) {
    
    const owner = await this.defaultIssuer(provider)

    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )
    
    const signer = aliasRegistryDeployed.connect(owner)

    const tx = await signer.setIdentityStore(
      identity,
      store,
      {
        gasPrice: ethers.utils.parseUnits('66', 'gwei'),
        // gasPrice: web3.utils.toWei('66', 'gwei'),
        // gasLimit: web3.utils.toWei('66', 'gwei')
      }
    )
    
    await tx.wait()

    return tx.hash
  }

  async getIdentityStore(identity, provider) {
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )
    return await aliasRegistryDeployed.getIdentity(identity)
  }
  
  async setAlias(identity, alias, burner, nonce, expiry, provider) {
    
    const owner = await this.defaultIssuer(provider)
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )
      
    const signer = aliasRegistryDeployed.connect(owner)
  
    const bytes32Alias = ethers.utils.formatBytes32String(alias)
    // const bytes32Alias = this.web3.utils.asciiToHex(alias)

    const isAlias = await aliasRegistryDeployed.isAlias(bytes32Alias)

    if (!isAlias) {
      //@debug listen for LogNewAlias event
      // aliasRegistryDeployed.on('LogNewAlias', (sender, alias, identityAddress, createdAt, updatedAt, burner, expiry, nonce, active, event) => {
      //   console.log('sender', sender)
      //   console.log('alias', alias)
      //   console.log('identityAddress', identityAddress.toLowerCase())
      //   console.log('createdAt', createdAt)
      //   console.log('updatedAt', updatedAt)
      //   console.log('burner', burner)
      //   console.log('expiry', expiry)
      //   console.log('nonce', nonce)
      //   console.log('active', active)
      //   console.log('blockNumber', event.blockNumber)
      // })

      const tx = await signer.setAlias(
        bytes32Alias,
        identity,
        burner,
        new Date(expiry).getTime(),
        nonce,
        {
          gasPrice: ethers.utils.parseUnits('72', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }
      )
    
      await tx.wait()

      return tx.hash
      
    } else {
      return '0x0'
    }

  }

  async getAlias(alias, provider) {

    const bytes32Alias = ethers.utils.formatBytes32String(alias)
    // const bytes32Alias = this.web3.utils.asciiToHex(alias)

    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )

    const isAlias = await aliasRegistryDeployed.isAlias(bytes32Alias)
    
    if (!isAlias) {
      return false
    } else {
      return await aliasRegistryDeployed.aliases(bytes32Alias)
    }
  }

  async setAliasActive(alias, active, provider) {

    const owner = await this.defaultIssuer(provider)
    const aliasRegistryDeployed = new ethers.Contract(
      this.contracts.AliasRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.AliasRegistryContract.abi,
      provider
    )  
      
    const signer = aliasRegistryDeployed.connect(owner)
  
    const bytes32Alias = ethers.utils.formatBytes32String(alias)

    const isAlias = await aliasRegistryDeployed.isAlias(bytes32Alias)

    if (!isAlias) {
      return false
    } else {
      //@debug listen for LogNewAlias event
      // aliasRegistryDeployed.on('LogAliasUpdated', (sender, alias, updatedAt, event) => {
      //   console.log('sender', sender)
      //   console.log('alias', alias)
      //   console.log('updatedAt', updatedAt)
      //   console.log('blockNumber', event.blockNumber)
      // })
      
      const tx = await signer.setAliasActive(
        bytes32Alias,
        active,
        {
          gasPrice: ethers.utils.parseUnits('66', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }  
      )
    
      await tx.wait()
      
      return tx.hash

    }
  }

  /// identityRegistry
  async setIdentityRegistry(identity, provider) {

    const owner = await this.defaultIssuer(provider)
    const identityRegistryDeployed = new ethers.Contract(
      this.contracts.IdentityRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.IdentityRegistryContract.abi,
      provider
    )  
      
    const signer = identityRegistryDeployed.connect(owner)

    const isIdentity = await identityRegistryDeployed.isIdentity(identity)

    // identityRegistryDeployed.on('LogNewIdentity', (sender, identityAddress, event) => {
    //   console.log('sender', sender)
    //   console.log('identityAddress', identityAddress.toLowerCase())
    //   console.log('blockNumber', event.blockNumber)
    // })

    if (!isIdentity) {
      const tx = await signer.setIdentity(
        identity,
        {
          gasPrice: ethers.utils.parseUnits('66', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }
      )
    
      await tx.wait()

      return tx.hash
    } else {
      return '0x0'
    }
  }

  async setLog(subject, audience, store, logType, provider) {

    const owner = await this.defaultIssuer(provider)
    const identityRegistryDeployed = new ethers.Contract(
      this.contracts.IdentityRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.IdentityRegistryContract.abi,
      provider
    )  

    const bytes32LogType = ethers.utils.formatBytes32String(logType)

    const signer = identityRegistryDeployed.connect(owner)

    const isIdentity = await identityRegistryDeployed.isIdentity(subject)

    // const filter = identityRegistryDeployed.filters.NewLog(null, subject, audience, store, logType)

    // identityRegistryDeployed.on(filter, (subject, audience, store, logType) => {
    //   console.log('log received ', subject, audience, store, logType)
    // })

    // identityRegistryDeployed.on('NewLog', (sender, subject, audience, createdAt, store, logType, event) => {
    //   console.log('sender', sender)
    //   console.log('subject', subject.toLowerCase())
    //   console.log('audience', audience.toLowerCase())
    //   console.log('createdAt', createdAt)
    //   console.log('store', store)
    //   console.log('logType', logType)
    //   console.log('blockNumber', event.blockNumber)

    // })

    if (isIdentity) {
      const tx = await signer.setLog(
        subject,
        audience,
        store,
        bytes32LogType,
        {
          gasPrice: ethers.utils.parseUnits('66', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }
      )
    
      await tx.wait()

      // await this.setLogTxn(tx.hash, store)
      // console.log('setLog store', store)
      // console.log('setLog tx', tx.hash)

      // identityRegistryDeployed.on('UpdateLog', (store, txn, event) => {
      //   console.log('store', store)
      //   console.log('txn', txn)
      //   console.log('blockNumber', event.blockNumber)
      // })
  
      // const logTx = await signer.setLogTx(store, tx.hash, { gasLimit: new BigNumber(6721975) })
      // await logTx.wait(1)
      // console.log('setLogTx', logTx)

      return tx.hash
    } else {
      return '0x0'
    }
  }

  async setLogTxn(store, txn, provider) {

    const owner = await this.defaultIssuer(provider)
    const identityRegistryDeployed = new ethers.Contract(
      this.contracts.IdentityRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.IdentityRegistryContract.abi,
      provider
    )  

    const signer = identityRegistryDeployed.connect(owner)

    const isLog = await identityRegistryDeployed.isLog(store)
    
    if (isLog) {
      const tx = await signer.setLogTx(
        store,
        txn,
        {
          gasPrice: ethers.utils.parseUnits('66', 'gwei'),
          // gasPrice: web3.utils.toWei('66', 'gwei'),
          // gasLimit: web3.utils.toWei('66', 'gwei')
        }  
      )
        
      await tx.wait()

      return tx.hash
    } else {
      return '0x0'
    }
  }

  async getLog(store, provider) {

    const identityRegistryDeployed = new ethers.Contract(
      this.contracts.IdentityRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.IdentityRegistryContract.abi,
      provider
    )  
      
    return await identityRegistryDeployed.logs(store)

  }

  async getLogs(subject, provider) {

    const identityRegistryDeployed = new ethers.Contract(
      this.contracts.IdentityRegistryContract.networks[await this.web3.eth.net.getId()].address,
      this.contracts.IdentityRegistryContract.abi,
      provider
    )  
      
    return await identityRegistryDeployed.getIdentity(subject)

  }
}


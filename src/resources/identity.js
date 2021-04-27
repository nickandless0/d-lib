import {
  ResourceBase,
  AliasObject,
  AuthObject,
  ErrorObject,
  IdentityObject,
  ServiceObject,
  SessionObject,
  ResponseObject,
  LogObject
} from './_base'

import JWTService from '../services/jwt-service'
import mJson from 'merge-json'
import * as inspector from 'schema-inspector'
import PubNub from 'pubnub'

export default class Identities extends ResourceBase {

  constructor({
    chainService,
    ipfsService,
    options
  }) {
    super({
      chainService,
      ipfsService,
      options
    })
    this.jwtService = new JWTService()

    this.pubnub = new PubNub({
      publishKey : options.pnKey,
      subscribeKey : options.pnsKey,
      ssl: true
    })

  }

  ///@dev completed
  async set(
    deviceId, 
    token
  ) {

    try {

      /// validate params
      const data = {
        deviceId,
        token
      }
      const validation = {
        type: 'object',
        properties: {
          deviceId: {
            type: 'string'
          },
          token: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params
      
      const start = Date.now()

      const profile = {}

      let store = {}

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const subject = await this.chainService.createIdentity('d')

      profile.assets = []
      
      profile.did = subject.did

      profile.address = subject.address

      profile.publicKey = subject.publicKey

      profile.token = token

      profile.deviceId = deviceId

      store = await this.setStore(profile)

      const tx = await this.chainService.setIdentity(subject.address, store, provider)

      this.chainService.setIdentityRegistry(subject.address, provider)

      if (tx !== '0x0') {      

        // this.setLog(subject.address, subject.address, {type: 'identity', action: 'create', name: 'wallet', tx: tx, timestamp: Math.floor(Date.now() / 1000)} )

        const elapsed = (Date.now() - start) + ' ms'

        const obj = Object.assign({}, {
          profile: profile
        }, {
          identity: subject.address,
          store: store,
          aliases: [],
          active: true,
          elapsed,
          tx: tx
        })

        return new IdentityObject(obj)

      } else {
        return new ErrorObject({
          message: 'Identity exists',
          stack: '0x0000000000000000000000000000000000000000'
        })
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async setLink(
    uuid, 
    token,
    appName,
    appDomain
  ) {

    try {

      /// validate params
      if (!uuid || !token) {
        return {
          message: 'Invalid params sent'
        }
      }

      const profile = {}

      let store = {}

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const subject = await this.chainService.createIdentity('d')

      profile.did = subject.did

      profile.address = subject.address

      profile.publicKey = subject.publicKey

      /// link
      profile.appName = appName

      profile.apiKey = subject.privateKey

      profile.appDomain = appDomain
      /// link

      profile.token = token

      profile.deviceId = uuid

      store = await this.setStore(profile)

      const tx = await this.chainService.setIdentity(subject.address, store, provider)

      this.chainService.setIdentityRegistry(subject.address, provider)

      if (tx !== '0x0') {      

        // this.setLog(subject.address, subject.address, {type: 'identity', action: 'create', name: 'wallet', tx: tx, timestamp: Math.floor(Date.now() / 1000)} )

        const elapsed = 2 + ' ms'

        const obj = Object.assign({}, {
          profile: profile
        }, {
          identity: subject.address,
          store: store,
          aliases: [],
          active: true,
          elapsed,
          tx: tx
        })

        return new IdentityObject(obj)

      } else {
        return new ErrorObject({
          message: 'Identity exists',
          stack: '0x0000000000000000000000000000000000000000'
        })
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async get(
    identity
  ) {

    try {

      /// validate params
      const data = {
        identity
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const res = await this.chainService.getIdentity(identity, provider)

      if (res) {

        const profile = await this.getStore(res[0])

        // todo get wallet when needed vs storing in IPFS
        // profile.wallet = await this.chainService.getWallet(res.privateKey, provider)
        
        const aliases = []
        // get aliases by address and return with identity
        for (const a of res[1]) {
          const aliasItem = await this.chainService.getAlias(this.chainService.ethers.utils.parseBytes32String(a), provider)
          aliases.push({active: aliasItem.active, alias: this.chainService.ethers.utils.parseBytes32String(a) })
        }
  
        const active = res[2]

        const elapsed = 2 + ' ms'
  
        const obj = Object.assign({}, {
          profile: profile
        }, {
          identity,
          store: res[0],
          aliases,
          active,
          elapsed
        })
  
        return new IdentityObject(obj)
  
      } else {
        return new IdentityObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async setIdentityActive(
    identity,
    active
  ) {

    try {

      /// validate params
      const data = {
        identity,
        active
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          active: {
            type: ['boolean', 'string']
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      const provider = await this.chainService.getProvider()

      const tx = await this.chainService.setIdentityActive(identity, active, provider)

      if (tx !== '0x0') {
        
        // this.setLog(identity, identity, {type: 'identity', action: 'deactivate', name: identity, tx: tx, timestamp: Math.floor(Date.now() / 1000)} )

        const success = true

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      } else {

        const success = false

        const obj = Object.assign({}, { success } )

        return new ResponseObject(obj)
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async setAlias(
    alias,
    identity,
    burner,
    nonce,
    expiry
  ) {

    try {

      /// validate params
      const data = {
        alias,
        identity,
        expiry
      }
      const validation = {
        type: 'object',
        properties: {
          alias: {
            type: 'string'
          },
          identity: {
            type: 'string'
          },
          expiry: {
            type: ['number', 'string']
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      const hasWhitespace = /\s/g.test(alias)
      if (hasWhitespace) {
        return {
          message: 'Alias names cannot contain spaces'
        }
      }

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const tx = await this.chainService.setAlias(identity, alias, burner, nonce, expiry, provider)

      if (tx !== '0x0') {

        // this.setLog(identity, identity, {type: 'alias', action: 'create', name: alias, tx: tx, timestamp: Math.floor(Date.now() / 1000)} )

        const res = await this.chainService.getAlias(alias, provider)

        if (res) {
  
          const elapsed = 2 + ' ms'
  
          const obj = Object.assign({}, {
            alias,
            identity: res.identityAddress,
            timestamp: Number(res.createdAt),
            burner: res.burner,
            expiry: Number(res.expiry),
            nonce: res.nonce,
            enabled: res.active,
            tx: tx,
            elapsed
          })

          return new AliasObject(obj)
  
        } else {
          return new ErrorObject({
            message: 'Alias set error',
            stack: '0x0000000000000000000000000000000000000000'
          })
        }

      } else {
        return new AliasObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async getAlias(
    alias
  ) {
    try {

      /// validate params
      const data = {
        alias
      }
      const validation = {
        type: 'object',
        properties: {
          alias: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      const hasWhitespace = /\s/g.test(alias)
      if (hasWhitespace) {
        return {
          message: 'Alias names cannot contain spaces'
        }
      }

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const res = await this.chainService.getAlias(alias, provider)

      /// todo double check this logic
      if (res.expiry !== undefined) {
        
        console.log('expiry', Number(res.expiry))
        console.log('now', Math.floor(Date.now() / 1000))

        if (Number(res.expiry) < Math.floor(Date.now() / 1000)) {
          await this.chainService.setAliasActive(alias, false, provider)
          res.active = false
        } 
      }
      /// once a nonce is used we deactivate it
      if (res.nonce === true) {
        await this.chainService.setAliasActive(alias, false, provider)
        res.active = false
      }

      if (res) {

        const elapsed = 2 + ' ms'

        const obj = Object.assign({}, {
          identity: res.identityAddress,
          timestamp: Number(res.createdAt),
          burner: res.burner,
          expiry: Number(res.expiry),
          nonce: res.nonce,
          enabled: res.active,
          alias,
          elapsed
        })

        return new AliasObject(obj)

      } else {
        return new AliasObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async getDID(
    did
  ) {
    // return did
    return this.chainService.getDocument(did)
  }
  ///@dev completed
  async setAliasActive(
    alias
  ) {

    try {

      /// validate params
      const data = {
        alias
      }
      const validation = {
        type: 'object',
        properties: {
          alias: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      const hasWhitespace = /\s/g.test(alias)
      if (hasWhitespace) {
        return {
          message: 'Alias names cannot contain spaces'
        }
      }

      const provider = await this.chainService.getProvider()

      // const resAlias = await this.chainService.getAlias(alias, provider)

      const tx = await this.chainService.setAliasActive(alias, false, provider)

      if (tx !== '0x0') {
        
        // this.setLog(resAlias.identityAddress, resAlias.identityAddress, {type: 'alias', action: 'deactivate', name: alias, tx: tx, timestamp: Math.floor(Date.now() / 1000)} )

        const success = true

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      } else {

        const success = false

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev completed
  async updateProfile(
    identity,
    payload
  ) {

    try {

      /// validate params
      const data = {
        identity,
        payload
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          payload: {
            type: ['string', 'object']
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      let profile = {}, store

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const is = await this.chainService.getIdentity(identity, provider)

      store = is[0]

      profile = await this.getStore(store)
      
      profile = await mJson.merge(profile, payload) 

      store = await this.setStore(profile)

      const tx = await this.chainService.setIdentityStore(identity, store, provider)

      if (tx !== '0x0') {

        // this.setLog(identity, identity, {type: 'identity', action: 'update', name: 'profile', tx: tx, timestamp: Math.floor(Date.now() / 1000)} )
        
        const success = true

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      } else {

        const success = false

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev complete
  async setLog(
    identity,
    audience,
    payload
  ) {

    try {
      
      /// validate params
      const data = {
        identity,
        audience,
        payload
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          audience: {
            type: 'string'
          },
          payload: {
            type: ['string', 'object']
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const store = await this.setStore(payload)
      /// can we store response here on the tx? it would be easier to parse the data via an emitter later
      const res = await this.chainService.setLog(identity, audience, store, payload.type, provider)

      await this.chainService.setLogTxn(store, res)

      if (res !== '0x0') {

        const success = true

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      } else {

        const success = false

        const obj = Object.assign({}, { success } )
  
        return new ResponseObject(obj)

      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev complete
  async getLog(
    identity,
    store
  ) {

    try {

      /// validate params
      const data = {
        identity,
        store
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          store: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const log = await this.chainService.getLog(store, provider)
      
      const logItem = await this.getStore(log)

      const obj = Object.assign({ payload: logItem}, {} )
      
      return new LogObject(obj)

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev complete
  async getLogs(
    identity
  ) {

    try {

      /// validate params
      const data = {
        identity
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const list = await this.chainService.getLogs(identity, provider)
      
      const logs = []

      for (const log of list) {        
        const logItem = await this.getStore(log)
        if (logItem.type === 'authorization') {
          logs.push({type: logItem.type, action: logItem.action, name: logItem.name, tx: logItem.tx, payload: logItem.payload, timestamp: logItem.timestamp})
        } else {
          logs.push({type: logItem.type, action: logItem.action, name: logItem.name, tx: logItem.tx, timestamp: logItem.timestamp})
        }
      }

      return logs

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev inprogress
  async authRequest(
    identity,
    audience,
    type
  ) {

    try {

      /// validate params
      const data = {
        identity,
        audience,
        type
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          audience: {
            type: 'string'
          },
          type: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()
      /// todo re-enable active alias checking 
      const subIdentity = await this.chainService.getIdentity(identity, provider)

      const subAlias32 = subIdentity[1][0]
      const subAlias = this.chainService.ethers.utils.parseBytes32String(subAlias32)

      const audIdentity = await this.chainService.getIdentity(audience, provider)
      
      const audAlias32 = audIdentity[1][0]
      const audAlias = this.chainService.ethers.utils.parseBytes32String(audAlias32)

      const subProfile = await this.getStore(subIdentity[0])

      const audProfile = await this.getStore(audIdentity[0])

      const claim = {
        from: audAlias,
        to: subAlias
      }
      
      /// we can add request features to the chain and maintain them there 
      let body = ' is requesting access to your private data '

      if (type === 'login') {
        body = ' is trying to use your Digital Identity to login' 
      }
      if (type === 'profile') {
        body = ' is requesting access to your private data '
      }
      if (type === 'propertyOwner') {
        body = ' is requesting access to your private data '
      }
      if (type === 'p2p') {
        body = ' is requesting a link to your Digital Identity '
      }
      if (type === 'kyc') {
        body = ' is requesting your authorization to send you through the KYC process '
      }
      if (type === 'kyb') {
        body = ' is requesting your authorization to send you through the KYB process '
      }

      const payloadData = { 
        claim: claim,
        address: audProfile.address,
        body: body, 
        response: undefined,
        type: type,
        appName: audProfile.appName,
        appDomain: audProfile.appDomain,
      }

      const payload = await this.jwtService.signToken(payloadData, Math.floor(Date.now() / 1000) + (60 * 60))

      await this.chainService.sendNotification({
        title: audAlias,
        body: 'You have a ' + type + ' request',
        data: {'token': payload},
        to: subProfile.token
      })
      
      const publishConfig = { 
        channel : audience, 
        message : {
          title: audAlias,
          body: 'You have a ' + type + ' request',
          data: {'token': payload},
          to: subProfile.token
        }
      } 

      await this.pubnub.publish(publishConfig)

      /// log for sub
      const resSub = await this.setLog(identity, audience, {type: 'authorization', action: 'request', name: type, tx: '0x0', payload: payload, timestamp: Math.floor(Date.now() / 1000)} )
      
      /// log for aud
      this.setLog(audience, identity, {type: 'authorization', action: 'requested', name: type, tx: '0x0', payload: payload, timestamp: Math.floor(Date.now() / 1000)} )

      const elapsed = 2 + ' ms'

      const obj = Object.assign({}, {
        subject: identity,
        audience,
        type,
        elapsed,
        action: 'request',
        tx: resSub[0]
      })
      
      return new AuthObject(obj)

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev inprogress
  async authResponse(
    identity,
    audience,
    type,
    response
  ) {

    try {

      /// validate params
      const data = {
        identity,
        audience,
        type,
        response
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          audience: {
            type: 'string'
          },
          type: {
            type: 'string'
          },
          response: {
            type: ['string', 'object']
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()
      
      const subIdentity = await this.chainService.getIdentity(identity, provider)
      const subAlias32 = subIdentity[1][0]
      const subAlias = this.chainService.ethers.utils.parseBytes32String(subAlias32)

      const audIdentity = await this.chainService.getIdentity(audience, provider)
      const audAlias32 = audIdentity[1][0]
      const audAlias = this.chainService.ethers.utils.parseBytes32String(audAlias32)

      const subProfile = await this.getStore(subIdentity[0])

      const audProfile = await this.getStore(audIdentity[0])

      const claim = {
        from: subAlias,
        to: audAlias
      }

      let service = ''

      if (response === 'approved') {
        if (type === 'profile') {
          if (subProfile.claim) {
            service = subProfile.claim.person
          } else {
            service = ' has not setup their profile yet.'
          }          
        } else if (type === 'propertyOwner') {
          /// 3rd party service trial is expired
          
          const call = await this.chainService.serviceRequest({
            subject: identity,
            audience,
            type, 
            body: subProfile.claim.person
          })
          
          // console.log('call', call)

          if (call.resp.statusCode === 200) {    
            const obj = Object.assign({}, {
              subject: identity,
              audience,
              payload: call.resp.message.property,
              elapsed: call.resp.elapsed
            })    
            service =  new ServiceObject(obj)    
          } else {
            service = new ErrorObject({
              message: service.message,
              stack: service.statusCode
            })        
          }
        } else if (type === 'p2p') {
          service = ' accepted your link request '
          // await this.d.identities.updateProfile(subject, {
          //   links: [{ alias: audAlias, identity: audience, active: true }]
          // })
          // await this.d.identities.updateProfile(audience, {
          //   links: [{ alias: subAlias, identity: subject, active: true }]
          // })
  
        } else if (type === 'kyc') {
          service = ' accepted the KYC request '
        } else if (type === 'kyb') {
          service = ' accepted the KYB request '
        }
      }
      
      const payloadData = { 
        claim: claim,
        address: subProfile.address,
        body: service,
        response: response,
        type: type,
        appName: audProfile.appName,
        appDomain: audProfile.appDomain
      }

      const payload = await this.jwtService.signToken(payloadData, Math.floor(Date.now() / 1000) + (60 * 60))
      // console.log('payload', payload)

      await this.chainService.sendNotification({
        title: subAlias,
        body: 'The ' + type + ' request was ' + response,
        data: {'token': payload},
        to: audProfile.token
      })

      const publishConfig = { 
        channel : audience, 
        message : {
          title: subAlias,
          body: 'The ' + type + ' request was ' + response,
          data: {'token': payload},
          to: audProfile.token
        }
      } 
  
      await this.pubnub.publish(publishConfig)

      // await this.chainService.sendCallback({
      //   body: 'The ' + type + ' request was ' + response,
      //   data: {'token': payload},
      //   to: audProfile.token
      // })

      this.setLog(identity, audience, {type: 'authorization', action: 'responded', name: type, tx: '0x0', payload: payload, timestamp: Math.floor(Date.now() / 1000)} )

      const resAud = await this.setLog(audience, identity, {type: 'authorization', action: 'response', name: type, tx: '0x0', payload: payload, timestamp: Math.floor(Date.now() / 1000)} )

      const elapsed = 2 + ' ms'

      const obj = Object.assign({}, {
        subject: identity,
        audience,
        type,
        elapsed,
        action: 'request',
        tx: resAud[0]
      })
      
      return new AuthObject(obj)

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev inprogress
  async test(audience) {

    setTimeout(async () => {
      const publishConfig = { 
        channel : audience, 
        message : 'Hello From Lib'
      } 
      await this.pubnub.publish(publishConfig)
    }, 5000)

  }
  ///@dev inprogress
  async service(
    identity,
    audience,
    type
  ) {

    try {

      /// validate params
      const data = {
        identity,
        audience,
        type
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          audience: {
            type: 'string'
          },
          type: {
            type: 'string'
          }         
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const subRes = await this.chainService.getAlias(identity, provider)
      
      const subIdentity = await this.chainService.getIdentity(subRes.identityAddress, provider)
      const audIdentity = await this.chainService.getIdentity(audience, provider)
      
      const subProfile = await this.getStore(subIdentity[0])
      console.log('subProfile', subProfile)

      const audProfile = await this.getStore(audIdentity[0])
      console.log('audProfile', audProfile)

      const claim = {
        address: '5 Wagon Trce',
        zip: '28731'
      }

      const call = await this.chainService.serviceRequest({
        identity,
        audience,
        type, 
        claim
      })

      if (call.resp.statusCode === 200) {

        const obj = Object.assign({}, {
          subject: identity,
          audience,
          payload: call.resp.message.property,
          elapsed: call.resp.elapsed
        })

        return new ServiceObject(obj)

      } else {
        return new ErrorObject({
          message: call.message,
          stack: call.statusCode
        })        
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  ///@dev inprogress
  async session(
    identity,
    token
  )  {
    try {

      await this.jwtService.verifyToken(token)
      
      /// validate params
      const data = {
        identity
      }
      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          }
        }
      }
      const result = inspector.validate(validation, data)
      if (!result.valid) {
        return new ErrorObject({
          message: result.format(),
          stack: new Date().getTime()
        })
      }
      /// validate params

      const call = await this.chainService.getIdentity({
        identity
      })

      if (call.resp.statusCode === 200) {

        const active = call.resp.active
        const elapsed = call.elapsed || 0

        if (active === 0) {
          return new ErrorObject({
            message: '401 Identity inactive',
            stack: '401'
          })
        }

        const expiry = Math.floor(Date.now() / 1000) + (60 * 60)

        const token = await this.jwtService.signToken(identity, expiry)

        const obj = Object.assign({}, {
          identity,
          active,
          token,
          expiry,
          elapsed
        })

        return new SessionObject(obj)

      } else {
        return new ErrorObject({
          message: call.resp.message,
          stack: call.resp.statusCode
        })
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }
  }
  ///@dev complete
  async setStore(
    ipfsObj
  ) {
    /// set to store
    // this.chainService.encryption = false -- enable/disable metadata encryption based on wallet keys during dev as needed
    const ipfsHash = await this.ipfsService.submitFile(ipfsObj)
    // console.log('ipfsHash', ipfsHash)
    const ipfsBytes = await this.ipfsService.getBytes32FromIpfsHash(ipfsHash)
    // console.log('ipfsBytes', ipfsBytes)
    return ipfsBytes
  }
  ///@dev complete
  async getStore(
    ipfsBytes
  ) {
    /// get from store
    // this.chainService.encryption = false -- enable/disable metadata encryption based on wallet keys during dev as needed
    const ipfsHashFromBytes = this.ipfsService.getIpfsHashFromBytes32(ipfsBytes)
    // console.log('ipfsHashFromBytes', ipfsHashFromBytes)
    const ipfsObj = await this.ipfsService.getFile(ipfsHashFromBytes)
    // console.log('ipfsObj', ipfsObj)
    return ipfsObj
  }
}

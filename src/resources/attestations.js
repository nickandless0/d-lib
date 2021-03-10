import {
  ResourceBase,
  AttestationObject,
  ErrorObject
} from './_base'

import * as inspector from 'schema-inspector'

import * as sha from 'js-sha3'

export default class Attestations extends ResourceBase {
  constructor({
    chainService,
    ipfsService,
  }) {
    super({
      chainService,
      ipfsService
    })
  }

  async asset({ identity, registry, metadata }) {
    
    try {
      
      /// validate params
      const data = {
        identity,
        registry,
        metadata        
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

      const call = await this.chainService.assetVerify({
        identity,
        registry,
        metadata
      })

      if (call.resp.statusCode === 200) {

        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, {
          claimType: call.resp.claimType,
          // issuer: issuer,
          data: sha.keccak256(call.resp.data),
          signature: call.resp.signature,
          metadata: call.resp.metadata,
          version: Math.floor(Date.now() / 1000),
          elapsed
        })

        const profile = await this.getStore(call.resp.store)

        profile.attestations.splice(profile.attestations.length, 1, obj)

        const hash = await this.setStore(profile)

        await this.chainService.updateIdentityStore({
          identity,
          registry,
          hash
        })

        return new AttestationObject(obj)

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

  async share({ identity, metadata }) {

    try {

      /// validate params
      if (!identity || !metadata ) {
        return { message: 'Invalid params sent'}
      }

      /// validate params
      const data = {
        identity,
        metadata        
      }

      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          metadata: {
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

      const call = await this.chainService.shareVerify({
        identity,
        metadata
      })

      if (call.resp.statusCode === 200) {

        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, {
          claimType: call.resp.claimType,
          // issuer: issuer,
          data: sha.keccak256(call.resp.data),
          signature: call.resp.signature,
          metadata: call.resp.metadata,
          version: Math.floor(Date.now() / 1000),
          elapsed
        })

        const profile = await this.getStore(call.resp.store)

        profile.attestations.splice(profile.attestations.length, 1, obj)

        const hash = await this.setStore(profile)

        await this.chainService.updateIdentityStore({
          identity,
          hash
        })

        return new AttestationObject(obj)

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

  async phoneGenerateCode({ number, countryCode }) {

    /// validate params
    const data = {
      number,
      countryCode        
    }

    const validation = {
      type: 'object',
      properties: {
        number: {
          type: ['string', 'number']
        },
        countryCode: {
          type: ['string', 'number']
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

    return await this.chainService.phoneGenerateCode({ number: number, countryCode: countryCode })
  }
  
  async phoneVerify({ identity, registry, metadata }) {
    
    try {

      /// validate params
      const data = {
        identity,
        registry,
        metadata
      }

      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          registry: {
            type: 'string'
          },
          metadata: {
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

      const call = await this.chainService.phoneVerify({
        identity,
        registry,
        metadata
      })

      if (call.resp.statusCode === 200) {

        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, {
          claimType: call.resp.claimType,
          // issuer: issuer,
          data: sha.keccak256(call.resp.data),
          signature: call.resp.signature,
          metadata: call.resp.metadata,
          version: Math.floor(Date.now() / 1000),
          elapsed
        })

        const profile = await this.getStore(call.resp.store)

        profile.attestations.splice(profile.attestations.length, 1, obj)

        const hash = await this.setStore(profile)

        await this.chainService.updateIdentityStore({
          identity,
          registry,
          hash
        })

        return new AttestationObject(obj)

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

  async emailGenerateCode({ identity, email }) {

    /// validate params
    const data = {
      identity,
      email
    }

    const validation = {
      type: 'object',
      properties: {
        identity: {
          type: 'string'
        },
        email: {
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

    return await this.chainService.emailGenerateCode({ identity, email })
  }

  async emailVerify({ identity, registry, metadata }) {
    
    try {

      /// validate params
      const data = {
        identity,
        registry,
        metadata
      }

      const validation = {
        type: 'object',
        properties: {
          identity: {
            type: 'string'
          },
          registry: {
            type: 'string'
          },
          metadata: {
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

      const call = await this.chainService.emailVerify({ 
        identity, 
        registry, 
        metadata 
      })

      if (call.resp.statusCode === 200) {
  
        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, { 
          claimType: call.resp.claimType,
          // issuer: issuer,
          data: sha.keccak256(call.resp.data),
          signature: call.resp.signature,
          metadata: call.resp.metadata,
          version: Math.floor(Date.now() / 1000),
          elapsed
        })
  
        const profile = await this.getStore(call.resp.store)
  
        profile.attestations.splice(profile.attestations.length, 1, obj)

        const hash = await this.setStore(profile)
  
        await this.chainService.updateIdentityStore({ 
          identity, 
          registry, 
          hash 
        })
  
        return new AttestationObject(obj)
  
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

  async setStore(
    ipfsObj
  ) {
    /// set to store
    const ipfsHash = await this.ipfsService.submitFile(ipfsObj)
    // console.log('ipfsHash', ipfsHash)
    const ipfsBytes = await this.ipfsService.getBytes32FromIpfsHash(ipfsHash)
    // console.log('ipfsBytes', ipfsBytes)
    return ipfsBytes
  }

  async getStore(
    ipfsBytes
  ) {
    /// get from store
    const ipfsHashFromBytes = this.ipfsService.getIpfsHashFromBytes32(ipfsBytes)
    // console.log('ipfsHashFromBytes', ipfsHashFromBytes)
    const ipfsObj = await this.ipfsService.getFile(ipfsHashFromBytes)
    // console.log('ipfsObj', ipfsObj)
    return ipfsObj
  }

}


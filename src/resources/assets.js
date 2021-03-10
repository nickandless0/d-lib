import {
  AssetObject,
  GetAssetObject,
  ErrorObject,
  TransferObject,
  ResourceBase,
  ShareObject
} from './_base'

import JWTService from '../services/jwt-service'
import * as inspector from 'schema-inspector'
import mJson from 'merge-json'
import { v4 } from 'uuid'
import PubNub from 'pubnub'

export default class Assets extends ResourceBase {
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

  async testJWT(
    token
  ) {
    
    try {
      token = await this.jwtService.verifyToken(token)

    } catch (err) {
      token = err.message
    }

    const obj = Object.assign({}, {
      token
    })

    return obj

  }

  async set( 
    asset,
    token
  ) {

    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        asset
      }
      const validation = {
        type: 'object',
        properties: {
          asset: {
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

      const provider = await this.chainService.getProvider()
      
      const assetId = v4()

      asset.id = assetId

      const store = await this.setStore(asset)

      const identityExists = await this.chainService.getIdentity(asset.identity, provider)

      if (identityExists) {

        const getStored = await this.getStore(identityExists[0])
        
        // getStored.assets.push(store)
        getStored.assets.push({
          assetId,
          store,
        })

        const setStored = await this.setStore(getStored)

        const tx = await this.chainService.setIdentityStore(asset.identity, setStored, provider)

        const elapsed = 2 + ' ms'

        const obj = Object.assign({}, {
          asset: asset
        }, {
          store,
          tx,
          elapsed
        })

        return new AssetObject(obj)

      } else {
        return new AssetObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }

  async get(
    store,
    identity
  ) {

    try {

      // await this.jwtService.verifyToken(token) ?
      
      /// validate params
      const data = {
        store,
        identity
      }
      const validation = {
        type: 'object',
        properties: {
          store: {
            type: 'string'
          },
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

      const provider = await this.chainService.getProvider()

      const identityExists = await this.chainService.getIdentity(identity, provider)

      if (identityExists) {

        const storedAsset = await this.getStore(store)
        
        // iterate through documents        
        // console.log('getAssetDocument', CryptoJS.enc.Base64.parse(storedAsset.asset.documents[0].contents).toString(CryptoJS.enc.Utf8) )

        const elapsed = 2 + ' ms'

        const obj = Object.assign({}, {
          asset: storedAsset
        }, {
          store,
          elapsed
        })

        return new GetAssetObject(obj)

      } else {
        return new GetAssetObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }

  async update(
    store,
    asset,
    identity,
    token
  ) {


    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        store,
        asset,
        identity
      }
      const validation = {
        type: 'object',
        properties: {
          store: {
            type: ['string', 'object']
          },
          asset: {
            type: ['string', 'object']
          },
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

      const originalAsset = await this.getStore(store)
      
      // replace documents array
      if (asset.documents &&
          asset.documents.length &&
          asset.isReplace) {
        delete originalAsset.documents
      }
      // replace keywords array
      if (asset.metadata &&
          asset.metadata.keywords &&
          asset.metadata.keywords.length &&
          asset.isReplace) {
        delete originalAsset.metadata.keywords
      }

      if (asset.isReplace) {
        delete asset.isReplace
      }

      const updatedAsset = await mJson.merge(originalAsset, asset)       
      const updatedStore = await this.setStore(updatedAsset)

      const is = await this.chainService.getIdentity(identity, provider)

      const profile = await this.getStore(is[0])

      // returns array of hashes
      // const results = profile.assets.map(item => item === store ? updatedStore : item)
      
      // returns array of objects
      const results = profile.assets.map(item => {
        if (item.store === store) {
          item.store = updatedStore
        }
        return item
      })

      profile.assets = results

      const hash = await this.setStore(profile)

      const tx = await this.chainService.setIdentityStore(identity, hash, provider)

      if (tx !== '0x0') {

        const elapsed = 2 + ' ms'

        const obj = Object.assign({}, {
          asset: updatedAsset
        }, {
          store: updatedStore,
          tx: tx,
          elapsed
        })
  
        return new AssetObject(obj)
  
      } else {
        return new AssetObject({})
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }

  async transfer(
    store,
    identity,
    owner,
    to,
    token
  ) {

    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        store,
        identity,
        owner,
        to        
      }
      const validation = {
        type: 'object',
        properties: {
          store: {
            type: 'string'
          },
          identity: {
            type: 'string'
          },
          owner: {
            type: 'string'
          },
          to: {
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

      const asset = {}
      const previousOwner = owner
      const newOwner = to

      const obj = Object.assign({}, {asset: asset}, {
        previousOwner,
        newOwner
      })
      
      return new TransferObject(obj)

    } catch (err) {

      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })

    }

  }

  async share( 
    store,
    identity,
    wallet,
    from,
    company,
    to,
    sharedBy,
    message,
    language,
    token
  ) {

    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        store,
        identity,
        wallet,
        from,
        company,
        to,
        sharedBy,
        message,
        language    
      }
      const validation = {
        type: 'object',
        properties: {
          store: {
            type: 'string'
          },
          identity: {
            type: 'string'
          },
          wallet: {
            type: ['string', 'object']
          },
          from: {
            type: 'string'
          },
          company: {
            type: 'string'
          },
          to: {
            type: 'string'
          },
          sharedBy: {
            type: 'string'
          },
          message: {
            type: 'string'
          },
          language: {
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

      const assetCall = await this.chainService.getAsset({ 
        store, 
        wallet 
      })

      if (!assetCall.resp.hash) {
        return { message: 'something went wrong'}
      }
      
      const asset = await this.getStore(assetCall.resp.hash)

      const metadata = {
        store,
        alias: asset.name,
        title: asset.metadata.title || asset.name,
        identity: identity,
        from: from,
        company: company,
        to: to,
        sharedBy: sharedBy,
        message: message,
        language: language
      }

      const call = await this.chainService.shareAsset({ 
        wallet, 
        metadata 
      })

      if (call.resp.statusCode === 200) {
        
        const message = await call.resp.message
        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, {
          store,
          message,
          elapsed
        })
          
        return new ShareObject(obj)
  
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
  
  async getShare(
    store,
    identity
  ) {

    try {
        
      /// validate params
      const data = {
        store,
        identity   
      }
      const validation = {
        type: 'object',
        properties: {
          store: {
            type: 'string'
          },
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

      const call = await this.chainService.getAsset({ 
        store, 
        identity 
      })

      if (!call.resp.hash) {
        return { message: 'something went wrong'}
      }
  
      const asset = await this.getStore(call.resp.hash)

      if (call.resp.statusCode === 200) {
  
        // const assetId = await call.resp.assetId
        // const owner = await call.resp.owner
        const elapsed = call.elapsed || 0

        const obj = Object.assign({}, { asset: asset }, {
          store,
          // tx,
          elapsed
        })
        
        return new AssetObject(obj)
  
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


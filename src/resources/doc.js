import {
  ResourceBase,
  DocObject,
  ErrorObject
} from './_base'

import JWTService from '../services/jwt-service'
import * as inspector from 'schema-inspector'
import PubNub from 'pubnub'

export default class Docs extends ResourceBase {
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
    this.web3EthAccounts = this.chainService.web3.eth.accounts
    this.web3EthPersonal = this.chainService.web3.eth.personal
    this.jwtService = new JWTService()

    this.pubnub = new PubNub({
      publishKey : options.pnKey,
      subscribeKey : options.pnsKey,
      ssl: true,
      // uuid: options.pnUUID      
    })

  }

  async set(
    base64,
    token
  ) {

    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        base64
      }
      const validation = {
        type: 'object',
        properties: {
          base64: {
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
      
      const store = await this.setStore(base64)
      const elapsed = (Date.now() - start) + ' ms'

      const obj = Object.assign({}, {
        store,
        elapsed
      })
      
      return new DocObject(obj)

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
  async get(
    store,
    token
  ) {

    try {

      await this.jwtService.verifyToken(token)

      /// validate params
      const data = {
        store
      }
      const validation = {
        type: 'object',
        properties: {
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

      const start = Date.now()

      const base64 = await this.getStore(store)
      const elapsed = (Date.now() - start) + ' ms'

      const obj = Object.assign({}, { 
        base64,
        elapsed
      })

      return new DocObject(obj)

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

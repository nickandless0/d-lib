import {
  ResourceBase,
  ErrorObject
} from './_base'

import * as inspector from 'schema-inspector'

export default class DID extends ResourceBase {
  constructor({
    chainService,
    ipfsService
  }) {
    super({
      chainService,
      ipfsService
    })
    this.web3EthAccounts = this.chainService.web3.eth.accounts
    this.web3EthPersonal = this.chainService.web3.eth.personal
  }

  async set(
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
      
    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }
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

      return await this.chainService.getDocument(`did:d:${identity}`)

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

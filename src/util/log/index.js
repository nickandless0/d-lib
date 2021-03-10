/*
  Logger Utility
*/
import {
  ErrorObject
} from '../../base'

import { Store } from '../store'

export class Log {

  constructor({
    chainService,    
    ipfsService
  }) {
    this.chainService = chainService
    this.ipfsService = ipfsService
    this.store = new Store({ ipfsService })
  }

  async set(
    subject,
    audience,
    payload
  ) {

    try {

      /// validate
      if (!payload || !subject || !audience) {
        return {
          message: 'Invalid params sent'
        }
      }
      
      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const store = await this.store.set(payload)
      /// do we store response here on the tx? it would be easier to parse the data via an emitter later
      const res = await this.chainService.setIAPLog(subject, audience, store, payload.type, provider)

      await this.chainService.setIAPLogTxn(store, res)

      // console.log('setLog tx', res)
      // console.log('setLog store', store)

      if (res !== '0x0') {
        return true
      } else {
        return false
      }

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }

  async get(
    identity,
    store
  ) {

    try {

      /// validate
      if (!identity || !store) {
        return {
          message: 'Invalid params sent'
        }
      }

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const log = await this.chainService.getIAPLog(store, provider)
      const logItem = await this.store.get(log)
    
      return logItem

    } catch (err) {
      return new ErrorObject({
        message: err.message,
        stack: err.stack
      })
    }

  }

  async getLogs(
    identity
  ) {

    try {

      /// validate
      if (!identity) {
        return {
          message: 'Invalid params sent'
        }
      }

      // const provider = await this.chainService.setProvider('rinkeby')
      const provider = await this.chainService.getProvider()

      const list = await this.chainService.getIAPLogs(identity, provider)
      
      const logs = []

      for (const log of list) {        
        const logItem = await this.store.get(log)
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

}

import ChainService from './services/chain-service'
import IpfsService from './services/ipfs-service'

import Identities from './resources/identity'
import Assets from './resources/assets'
import Attestations from './resources/attestations'
import Docs from './resources/doc'

const fetch = require('cross-fetch')

const VERSION = require('.././package.json').version

const defaultAPIServer = 'http://localhost:8000'
const defaultIpfsApiDomain = '127.0.0.1'
const defaultIpfsApiPort = '5002'
const defaultIpfsGatewayDomain = '127.0.0.1'
const defaultIpfsGatewayPort = '8080'
const defaultIpfsProtocol = 'http'

export default class DProtocol {
  constructor({
    apiServer = defaultAPIServer,
    ipfsApiDomain = defaultIpfsApiDomain,
    ipfsApiPort = defaultIpfsApiPort,
    ipfsGatewayDomain = defaultIpfsGatewayDomain,
    ipfsGatewayPort = defaultIpfsGatewayPort,
    ipfsProtocol = defaultIpfsProtocol,
    web3,
    options = {}
  } = {}) {
    this.apiServer = apiServer
    this.options = options
    this.version = VERSION

    this.chainService = new ChainService({
      apiServer,
      fetch,
      web3,
      options: this.options
    })

    this.ipfsService = new IpfsService({
      ipfsApiDomain,
      ipfsApiPort,
      ipfsGatewayDomain,
      ipfsGatewayPort,
      ipfsProtocol,
      options: this.options
    })

    this.attestations = new Attestations({
      chainService: this.chainService,
      ipfsService: this.ipfsService,
      options: this.options      
    })

    this.assets = new Assets({
      chainService: this.chainService,
      ipfsService: this.ipfsService,
      options: this.options      
    })

    this.docs = new Docs({
      chainService: this.chainService,
      ipfsService: this.ipfsService,
      options: this.options      
    })

    this.identities = new Identities({
      chainService: this.chainService,
      ipfsService: this.ipfsService,
      options: this.options
    })

  }
}


const MapCache = require('map-cache')
const fetch = require('cross-fetch')
const FormData = require('form-data')
const bs58 = require('bs58')

const Ports = {
  http: '80',
  https: '443'
}

export default class IpfsService {
  constructor({
    ipfsApiDomain,
    ipfsApiPort,
    ipfsGatewayDomain,
    ipfsGatewayPort,
    ipfsProtocol,
    options
  } = {}) {
    this.gateway = `${ipfsProtocol}://${ipfsGatewayDomain}`
    this.api = `${ipfsProtocol}://${ipfsApiDomain}`

    if (ipfsGatewayPort && Ports[ipfsProtocol] !== ipfsGatewayPort) {
      this.gateway += `:${ipfsGatewayPort}`
    }
    if (ipfsApiPort && Ports[ipfsProtocol] !== ipfsApiPort) {
      this.api += `:${ipfsApiPort}`
    }

    this.mapCache = new MapCache()
    this.options = options
  }

  getBytes32FromIpfsHash(ipfsHash) {
    return (
      '0x' + bs58.decode(ipfsHash).slice(2).toString('hex')
    )
  }

  getIpfsHashFromBytes32(bytes32Hex) {
    const hashHex = '1220' + bytes32Hex.slice(2)
    const hashBytes = Buffer.from(hashHex, 'hex')
    const hashStr = bs58.encode(hashBytes)
    return hashStr
  }

  async submitFile(jsonData) {
    try {
      const formData = new FormData()
      formData.append('file', this.content(jsonData))

      const rawRes = await fetch(`${this.api}/api/v0/add`, {
        method: 'POST',
        body: formData
      })
      // console.log('rawRes', rawRes)
      const res = await rawRes.json()
      // this.mapCache.set(res.Hash, jsonData)
      return res.Hash
    } catch (e) {
      throw new Error('Failure to submit file to IPFS', e)
      /* do nothing */
    }
  }

  content(data) {
    if (typeof Blob === 'undefined') {
      return new Buffer(JSON.stringify(data))
    } else {
      return new Blob([JSON.stringify(data)])
    }
  }

  async getFile(ipfsHashStr) {
    // if (this.mapCache.has(ipfsHashStr)) {
    //   return this.mapCache.get(ipfsHashStr)
    // }
    try {
      const response = await fetch(this.gatewayUrlForHash(ipfsHashStr))
      const ipfsData = await response.json()
      // this.mapCache.set(ipfsHashStr, ipfsData)
      return ipfsData
    } catch (e) {
      throw new Error('Failure to get IPFS file', e)
      /* do nothing */
    }
  }

  gatewayUrlForHash(ipfsHashStr) {
    return `${this.gateway}/ipfs/${ipfsHashStr}`
  }
}
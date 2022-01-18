import ChainService from '../src/services/chain-service.js'
import IpfsService from '../src/services/ipfs-service.js'

import { expect } from 'chai'
import { v4 } from 'uuid'
import mJson from 'merge-json'
import Web3 from 'web3'
import CryptoJS from 'crypto-js'

// const Time30Days = () => Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60
const Time24Hours = () => Math.floor(new Date().getTime() / 1000) + 24 * 60 * 60
// const Time1Hour = () => Math.floor(new Date().getTime() / 1000) + 60 * 60
// const Time15Minute = () => Math.floor(new Date().getTime() / 1000) + 60 * 15
// const Time1Minute = () => Math.floor(new Date().getTime() / 1000) + 60

describe('Journey', () => {

  // setup
  let identityRegistry
  let chainService
  let ipfsService
  let provider
  let web3
  let web3Provider
  let url

  // identity
  let subject
  let token = v4()
  let deviceId = v4()

  // alias
  let alias
  let burner = false
  let nonce = false
  let expiry = Time24Hours()

  // distributed data
  let asset
  let assets = {}
  let profile = {}
  let store = {}
  let fileStore = {}
  let qrCode

  // helper functions
  const generateAlias = (max) => {
    let text = ''
    const possible = '0123456789'
    for( let i=0; i < max; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
  }

  const setStore = async ( ipfsObj ) => {
    const ipfsHash = await ipfsService.submitFile(ipfsObj)
    console.log('ipfsHash', ipfsHash)
    const ipfsBytes = await ipfsService.getBytes32FromIpfsHash(ipfsHash)
    // console.log('ipfsBytes', ipfsBytes)
    return ipfsBytes
  }

  const getStore = async ( ipfsBytes ) => {
    const ipfsHashFromBytes = ipfsService.getIpfsHashFromBytes32(ipfsBytes)
    console.log('ipfsHashFromBytes', ipfsHashFromBytes)
    const ipfsObj = await ipfsService.getFile(ipfsHashFromBytes)
    console.log('ipfsObj', ipfsObj)
    return ipfsObj
  }
  
  // tests
  before(async () => {
  
    url = 'https://rinkeby.infura.io/v3/3a0c0f8b7bf7435ba9ec3b440eaa403e'
    // url = 'http://localhost:8545'

    // provider = await chainService.setProvider('rinkeby')
    // provider = await chainService.ethers.getDefaultProvider()

    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    web3Provider = new Web3.providers.HttpProvider(url)
    web3 = new Web3(web3Provider)

    chainService = await new ChainService({ web3 })

    provider = await new chainService.ethers.providers.JsonRpcProvider(url)
        
    ipfsService = new IpfsService({
      ipfsApiDomain: 'ipfs.infura.io',
      ipfsApiPort: 5001, // 443 ?
      ipfsGatewayDomain: 'gateway.ipfs.io',
      ipfsGatewayPort: 443,
      ipfsProtocol: 'https'
    })

  })  

  describe('Create Identity Wallet', async () => {

    it('should register identity, phone number as alias and create wallet', async () => {

      const wallet = await chainService.createIdentity('d')
      console.log('wallet', wallet)

      profile.assets = []
      
      profile.did = wallet.did

      profile.address = wallet.address

      profile.publicKey = wallet.publicKey

      profile.token = token

      profile.deviceId = deviceId

      console.log('profile', profile)

      store = await setStore(profile)

      console.log('store', store)

      console.log('get store', await getStore(store))

      const txSetIdentity = await chainService.setIdentity(wallet.address, store, provider)
      console.log('\n\ntxSetIdentity', txSetIdentity)

      const txRegistry = await chainService.setIdentityRegistry(wallet.address, provider)
      console.log('\n\ntxRegistry', txRegistry)

    })

    it('should create alias', async () => {

      const txSetAlias = await chainService.setAlias(subject.address, alias, burner, nonce, expiry, provider)
      console.log('\n\ntxSetAlias', txSetAlias)

      expect(txSetAlias).to.not.be.null

    })

    it('should get aliases', async () => {

      const txGetAlias = await chainService.getAlias(alias, provider)
      // console.log('txGetAlias', txGetAlias)

      const txGetIdentity = await chainService.getIdentity(subject.address, provider)
      // console.log('txGetIdentity', txGetIdentity) // index 1 contains array of encdoded aliases

      const aliases = []
      for (const a of txGetIdentity[1]) {
        // console.log('a', a)

        const aliasItem = await chainService.getAlias(chainService.ethers.utils.formatBytes32String(a), provider)
        // console.log('aliasItem', aliasItem)
        aliases.push({ active: aliasItem.active, alias: chainService.ethers.utils.formatBytes32String(a) })
      }
      // console.log('aliases', aliases)

      if (txGetIdentity) {
        const getStored = await getStore(txGetIdentity[0])
        const deciphertext = CryptoJS.AES.decrypt(getStored, subject.privateKey).toString(CryptoJS.enc.Utf8)
        console.log('\n\ngetStored', deciphertext)
      }

      expect(aliases).to.not.be.empty

    })

})
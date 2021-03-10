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
    // url = 'https://chain.singidea.com'
    // url = 'http://localhost:8545'

    // provider = await chainService.setProvider('rinkeby')
    // provider = await chainService.ethers.getDefaultProvider()

    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
    web3Provider = new Web3.providers.HttpProvider(url)
    web3 = new Web3(web3Provider)

    chainService = await new ChainService({ web3 })

    provider = await new chainService.ethers.providers.JsonRpcProvider(url)
    
    // console.log('provider', provider) QmWqpTVQ7cmS7WGaYwfoy4yBgpLzeBdxgG7LuJgNep2QUx
    
    // ipfsService = new IpfsService({
    //   ipfsApiDomain: 'ipfs-api.singidea.com',
    //   ipfsApiPort: 443,
    //   ipfsGatewayDomain: 'ipfs-gw.singidea.com',
    //   ipfsGatewayPort: 443,
    //   ipfsProtocol: 'https'
    // })

    ipfsService = new IpfsService({
      ipfsApiDomain: 'ipfs.infura.io',
      ipfsApiPort: 5001, // 443 ?
      ipfsGatewayDomain: 'gateway.ipfs.io',
      ipfsGatewayPort: 443,
      ipfsProtocol: 'https'
    })

    // ipfsService = new IpfsService({
    //   ipfsApiDomain: '127.0.0.1',
    //   ipfsApiPort: 5002,
    //   ipfsGatewayDomain: '127.0.0.1',
    //   ipfsGatewayPort: 8080,
    //   ipfsProtocol: 'http'
    // })

    // deviceId = v4()
    // token = v4()

    // alias = generateAlias(10)'


  })  

  describe('Create Identity Wallet', async () => {

    it('should register identity, phone number as alias and create wallet', async () => {

      // store = await setStore({hello: 'world'})
      // console.log(store)
      // profile = await getStore('0xa6de78602f09643581e15c6de4f63e2be6a8d6ef0eec27117364f76cb0ec924a') // old '0x6a6f686e40646f6d61696e2e636f6d2b2b6172676f732e696400000000000000'

      // console.log('profile', profile)
      // expect(profile).to.not.be.null

      // console.log('deviceId', deviceId)
      // console.log('token', token)

      // console.log('alias', alias)
      // console.log('burner', burner)
      // console.log('nonce', nonce)
      // console.log('expiry', expiry)

      /// test pull existing 

      // console.log(ipfsService) 
      // 0x31c237b149a41706e1fb1bdfe6aa3eb306895357aa93ec80208df7a71ed75560
      // console.log(await getStore('0x31c237b149a41706e1fb1bdfe6aa3eb306895357aa93ec80208df7a71ed75560'))

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

      /// end test pull existing

      // subject = await chainService.createIdentity('d')
      // // console.log('subject', subject.privateKey)

      // profile.assets = []

      // profile.did = subject.did

      // profile.address = subject.address

      // profile.publicKey = subject.publicKey

      // profile.token = token

      // profile.deviceId = deviceId

      // // console.log('profile', profile)
      // const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(profile), subject.privateKey)
      // // console.log('ciphertext', ciphertext.toString())
      // // const deciphertext = CryptoJS.AES.decrypt(ciphertext.toString(), subject.privateKey).toString(CryptoJS.enc.Utf8)
      // // console.log('deciphertext', deciphertext)

      // store = await setStore(ciphertext.toString())
      // console.log('\n\nstore', store)

      // // const getStored = await getStore(store)
      // // console.log('getStored', getStored)

      // const txSetIdentity = await chainService.setIdentity(subject.address, store, provider)
      // console.log('\n\ntxSetIdentity', txSetIdentity)

      // const txSetIdentityRegistry = await chainService.setIdentityRegistry(subject.address, provider)
      // console.log('\n\ntxSetIdentityRegistry', txSetIdentityRegistry)

      // expect(subject).to.not.be.null

    })

    it('should create alias', async () => {

      // const txSetAlias = await chainService.setAlias(subject.address, alias, burner, nonce, expiry, provider)
      // console.log('\n\ntxSetAlias', txSetAlias)

      // expect(txSetAlias).to.not.be.null

    })

    it('should get aliases', async () => {

      // const txGetAlias = await chainService.getAlias(alias, provider)
      // // console.log('txGetAlias', txGetAlias)

      // const txGetIdentity = await chainService.getIdentity(subject.address, provider)
      // // console.log('txGetIdentity', txGetIdentity) // index 1 contains array of encdoded aliases

      // const aliases = []
      // for (const a of txGetIdentity[1]) {
      //   // console.log('a', a)

      //   const aliasItem = await chainService.getAlias(chainService.ethers.utils.formatBytes32String(a), provider)
      //   // console.log('aliasItem', aliasItem)
      //   aliases.push({ active: aliasItem.active, alias: chainService.ethers.utils.formatBytes32String(a) })
      // }
      // // console.log('aliases', aliases)

      // if (txGetIdentity) {
      //   const getStored = await getStore(txGetIdentity[0])
      //   const deciphertext = CryptoJS.AES.decrypt(getStored, subject.privateKey).toString(CryptoJS.enc.Utf8)
      //   console.log('\n\ngetStored', deciphertext)
      // }

      // expect(aliases).to.not.be.empty

    })

    it('should create secure disclosure', async () => {

      // asset = {
      //   asset: {
      //     id: uuid(),
      //     type: 'securedisclosure',
      //     alias: alias,
      //     identity: subject.address,
      //     documents: [
      //       {
      //         name: 'test.txt',
      //         size: 4426,
      //         type: 'text/plain',
      //         contents: 'dGVzdA=='
      //       }
      //     ],
      //     metadata: {
      //       title: 'test sd',
      //       description: 'abstract text',
      //       keywords: [
      //         'keyword1'
      //       ],
      //       author: 'John Dutchak',
      //       company: '',
      //       createdAt: new Date().toISOString,
      //       updatedAt: new Date().toISOString,
      //       accessHistory: [
      //         {
      //           accessType: 'create',
      //           accessDate: new Date().toISOString,
      //           accessBy: 'John Dutchak'
      //         }
      //       ]
      //     }
      //   }
      // }

      // const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(asset), subject.privateKey)
      // fileStore = await setStore(ciphertext.toString())
      // console.log('\n\nfileStore', fileStore)

      // const txGetIdentity = await chainService.getIdentity(subject.address, provider)
      // // console.log('txGetIdentity', txGetIdentity) // index 0 contains store hash

      // if (txGetIdentity) {
      //   const getStored = await getStore(txGetIdentity[0])

      //   const deciphertext = JSON.parse(CryptoJS.AES.decrypt(getStored, subject.privateKey).toString(CryptoJS.enc.Utf8))
        
      //   deciphertext.assets.push(fileStore)
      //   // console.log('getStored profile', JSON.stringify(deciphertext))

      //   const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(deciphertext), subject.privateKey)
      //   const setStored = await setStore(ciphertext.toString())
      //   console.log('setStored', setStored)
      //   const txSetIdentityStore = await chainService.setIdentityStore(subject.address, setStored, provider)
      //   console.log('txSetIdentityStore', txSetIdentityStore)
  
      // }

    })

    it('should get updated identity profile', async () => {

      // const txGetIdentity = await chainService.getIdentity(subject.address, provider)
      // console.log('txGetIdentity', txGetIdentity) // index 0 contains store hash

      // if (txGetIdentity) {
      //   const getStored = await getStore(txGetIdentity[0])
      //   const deciphertext = JSON.parse(CryptoJS.AES.decrypt(getStored, subject.privateKey).toString(CryptoJS.enc.Utf8))
      //   console.log('\n\ngetStored', deciphertext)
      //   qrCode = await chainService.getQRCodeURI(JSON.stringify(deciphertext))
      //   console.log('qrCodeURI', qrCode)
      // }

    })

    // it('should get asset', async () => {

    //   const txGetIdentity = await chainService.getIdentity(subject.address, provider)
    //   // console.log('txGetIdentity', txGetIdentity) // index 0 contains store hash

    //   if (txGetIdentity) {
    //     const getStored = await getStore(txGetIdentity[0])
    //     const deciphertext = CryptoJS.AES.decrypt(getStored, subject.privateKey).toString(CryptoJS.enc.Utf8)
    //     // console.log('getStored updated profile', JSON.stringify(deciphertext))

    //     // iterate through assets
    //     const getAsset = await getStore(deciphertext.assets[0])
    //     console.log('getAsset', getAsset)

    //     // iterate through documents
        
    //     console.log('getAssetDocument', CryptoJS.enc.Base64.parse(getAsset.asset.documents[0].contents).toString(CryptoJS.enc.Utf8) )

    //   }

    // })

  })


})

/// login object
// {
//   "LoginType": {
//     "loginType": "with-password"
//   },
//   "AutoScroll": {
//     "ourTeam": false,
//     "formContent": false
//   },
//   "downloadAsset": {
//     "isDownloaded": false
//   },
//   "requestAccess": {
//     "expiresAt": null,
//     "requestId": null,
//     "assetAlias": null,
//     "requestorName": null,
//     "requestorEmail": null
//   },
//   "sharedAsset": {
//     "shareId": null,
//     "sharedBy": null,
//     "expiresAt": null,
//     "assetAlias": null,
//     "recipientEmail": null
//   },
//   "strapiContent": {
//     "pages": []
//   },
//   "appLanguage": {
//     "languageCode": "en",
//     "languageName": "English"
//   },
//   "strapiAuth": {
//     "token": null,
//     "expiresAt": null,
//     "authenticated": false
//   },
//   "appUser": {
//     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NzQwOTMyNjQsImRhdGEiOiJhY2MxSjY5MVhEWjAwODA2IiwiYWxnb3JpdGhtIjoiSFMyNTYiLCJpYXQiOjE1NzQwODk2NjR9.hNpAMpgSUbY-gr7VWhy1SNzPZNBome49Wn1e-huXGwo",
//     "identity": "acc1J691XDZ00806",
//     "assets": [
//       {
//         "asset": {
//           "name": "745799d0-6cd6-11e9-8cba-e3ca2140bd74",
//           "assetType": "securedisclosure",
//           "description": "share test",
//           "documents": [],
//           "metadata": {
//             "title": "Share Test May 2",
//             "abstract": "share test",
//             "keywords": [],
//             "createdAt": "Thu, 02 May 2019 12:33:14 GMT",
//             "updatedAt": "Thu, 02 May 2019 12:33:44 GMT",
//             "ownerFullName": "John Dutchak",
//             "authorIdentity": "acc1J691XDZ00806",
//             "ownerCompany": "PH",
//             "accessHistory": [
//               {
//                 "accessType": "create",
//                 "accessDate": "Thu, 02 May 2019 12:33:14 GMT",
//                 "accessBy": "John Dutchak"
//               },
//               {
//                 "accessType": "shared",
//                 "accessDate": "Thu, 02 May 2019 12:33:44 GMT",
//                 "sharedTo": "john.dutchak@gmail.com",
//                 "sharedBy": "John Dutchak"
//               }
//             ],
//             "institutionAccess": {
//               "isEnabled": false,
//               "accessDomain": "@dutchak.com"
//             },
//             "guestAccess": {
//               "isEnabled": true,
//               "isRequiredNDA": false,
//               "uploadedNDAType": "default"
//             },
//             "citations": [],
//             "priorDisclosures": [],
//             "shareHistory": [
//               {
//                 "shareId": "8562b2f0-6cd6-11e9-8cba-e3ca2140bd74",
//                 "sharedBy": "john-dutchak",
//                 "ndaAlias": "",
//                 "ndaDocHash": "",
//                 "recipients": [
//                   "john.dutchak@gmail.com"
//                 ]
//               }
//             ]
//           }
//         },
//         "assetId": "b4cc6d0d59b07b53ce050fc069bb90dfae9513cc88120a615fbb665386d365d4",
//         "owner": "jdutchak",
//         "elapsed": "161 ms"
//       },
//       {
//         "asset": {
//           "name": "d5eb4210-0a14-11ea-bad1-136df50bae5e",
//           "assetType": "securedisclosure",
//           "description": "abstract text",
//           "documents": [
//             {
//               "name": "eth.build.txt",
//               "size": 4426,
//               "type": "text/plain",
//               "fileBaseType": "Text",
//               "uploadedFileType": "sd-files",
//               "formattedFileSize": "4 kb",
//               "docHash": "0xcbe2f6f57e15b7c1cb59e5cb8beb0612da765a5bd166d08f04aa67d2ba76299b"
//             }
//           ],
//           "metadata": {
//             "title": "test sd",
//             "abstract": "abstract text",
//             "keywords": [
//               "keyword1"
//             ],
//             "createdAt": "Mon, 18 Nov 2019 15:05:18 GMT",
//             "updatedAt": "Mon, 18 Nov 2019 15:05:18 GMT",
//             "ownerFullName": "John Dutchak",
//             "authorIdentity": "acc1J691XDZ00806",
//             "ownerCompany": "PH",
//             "accessHistory": [
//               {
//                 "accessType": "create",
//                 "accessDate": "Mon, 18 Nov 2019 15:05:18 GMT",
//                 "accessBy": "John Dutchak"
//               }
//             ],
//             "institutionAccess": {
//               "isEnabled": false,
//               "accessDomain": "@dutchak.com"
//             },
//             "guestAccess": {
//               "isEnabled": true,
//               "isRequiredNDA": false,
//               "uploadedNDAType": "default"
//             },
//             "citations": [],
//             "priorDisclosures": []
//           }
//         },
//         "assetId": "5709bfd511d075bab03c5a397288b20b527acd5e09a1ed58809f27dce416f718",
//         "owner": "jdutchak",
//         "elapsed": "228 ms"
//       }
//     ],
//     "sharedWithMe": [
//       {
//         "assetAlias": "f43d25a0-1b5c-11e9-8893-f70ea76dd146",
//         "sharedBy": "John Dutchak"
//       },
//       {
//         "assetAlias": "d2b23370-235f-11e9-ad47-c3ff508d529c",
//         "sharedBy": "Alka Lachhwani"
//       },
//       {
//         "assetAlias": "eb0148b0-2370-11e9-bbb7-c55b320d2dbe",
//         "sharedBy": "Kenjoe Golo"
//       },
//       {
//         "assetAlias": "b8173290-2373-11e9-bbb7-c55b320d2dbe",
//         "sharedBy": "Kenjoe Golo"
//       },
//       {
//         "assetAlias": "3db985e0-f126-11e8-b2b0-17e845c58156",
//         "sharedBy": "alka-lachhwani"
//       },
//       {
//         "assetAlias": "3679cdc0-23d1-11e9-9497-4d5af3eb8f9b",
//         "sharedBy": "Kenjoe Golo"
//       },
//       {
//         "assetAlias": "2ac55f30-1b5c-11e9-8458-a1213575dacb",
//         "sharedBy": "alka-lachhwani"
//       }
//     ],
//     "sharedAlerts": [
//       {
//         "assetAlias": "fcc34820-f380-11e8-b469-03ca2d693257",
//         "created": "2019-01-25T18:41:11.027Z",
//         "dismissed": false,
//         "viewed": true,
//         "sharedBy": "alka-lachhwani",
//         "shareId": "c759fa80-20d0-11e9-a5d1-573902d38181",
//         "ndaAlias": "38425b30-20d0-11e9-a5d1-573902d38181",
//         "ndaDocHash": "0xbbbdaca9020a8c0a6491b512f6027e0d40f632ceab6c5cad9aba6470d6b70331"
//       },
//       {
//         "assetAlias": "3679cdc0-23d1-11e9-9497-4d5af3eb8f9b",
//         "created": "2019-01-29T14:56:20.400Z",
//         "dismissed": false,
//         "viewed": true,
//         "sharedBy": "kenjoe-golo",
//         "shareId": "0669a0b0-23d6-11e9-a376-cb7c394265ad",
//         "ndaAlias": "02d3c3a0-2371-11e9-bbb7-c55b320d2dbe",
//         "ndaDocHash": "0x1a3c3ba3d00aaedc991c7039ad6008fd5b0eab70a0f68ec1992d47c5d56fca2c"
//       },
//       {
//         "assetAlias": "d2b23370-235f-11e9-ad47-c3ff508d529c",
//         "created": "2019-01-29T19:22:11.442Z",
//         "dismissed": false,
//         "viewed": true,
//         "sharedBy": "alka-lachhwani",
//         "shareId": "28e72070-23fb-11e9-b0ba-f3d6dc4afa5b",
//         "ndaAlias": "38425b30-20d0-11e9-a5d1-573902d38181",
//         "ndaDocHash": "0xbbbdaca9020a8c0a6491b512f6027e0d40f632ceab6c5cad9aba6470d6b70331"
//       },
//       {
//         "assetAlias": "3db985e0-f126-11e8-b2b0-17e845c58156",
//         "created": "2019-01-29T19:20:54.815Z",
//         "dismissed": false,
//         "viewed": true,
//         "sharedBy": "alka-lachhwani",
//         "shareId": "fbb2b560-23fa-11e9-b0ba-f3d6dc4afa5b",
//         "ndaAlias": "c8559980-23fa-11e9-b0ba-f3d6dc4afa5b",
//         "ndaDocHash": "0xbbbdaca9020a8c0a6491b512f6027e0d40f632ceab6c5cad9aba6470d6b70331"
//       },
//       {
//         "assetAlias": "2ac55f30-1b5c-11e9-8458-a1213575dacb",
//         "created": "2019-02-11T15:38:46.138Z",
//         "dismissed": false,
//         "viewed": true,
//         "sharedBy": "alka-lachhwani",
//         "shareId": "1d051740-2e13-11e9-8eb2-13569c5dc3c0",
//         "ndaAlias": "c8559980-23fa-11e9-b0ba-f3d6dc4afa5b",
//         "ndaDocHash": "0xbbbdaca9020a8c0a6491b512f6027e0d40f632ceab6c5cad9aba6470d6b70331"
//       }
//     ],
//     "requestAccess": [],
//     "username": "jdutchak",
//     "attestations": [
//       {
//         "claimType": "2",
//         "data": "caa54e1b0a1dbfc8e1ecf2baef72247781ea07547f878d8b29b21543d990a365",
//         "signature": "7e3f6ceba54913f71728c12cef250b19ccf581dd8f2e5ecea7f0d4d04aac6dc9",
//         "metadata": {
//           "countryCode": "1",
//           "number": "3366016892",
//           "code": "2694"
//         },
//         "version": 1541129189,
//         "elapsed": "510 ms"
//       }
//     ],
//     "expiresAt": 1574093144,
//     "profile": {
//       "firstName": "John",
//       "lastName": "Dutchak",
//       "company": "PH",
//       "email": "john@dutchak.com"
//     },
//     "language": {
//       "languageCode": "en",
//       "languageName": "English"
//     },
//     "customTabs": [],
//     "links": [
//       "john"
//     ]
//   }
// }
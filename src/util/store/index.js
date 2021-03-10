/*
  Decentralized Store
*/
export class Store {

  constructor({
    ipfsService
  }) {
    this.ipfsService = ipfsService
  }
  
  async set(
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
  
  async get(
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

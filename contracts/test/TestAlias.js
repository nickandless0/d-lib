const AliasRegistry = artifacts.require('AliasRegistry.sol')

const Web3 = require('web3')
const web3 = new Web3()

const Promise = require('bluebird')

web3.eth = Promise.promisifyAll(web3.eth)

contract('AliasRegistry', accounts => {

  const owner = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const user3 = accounts[3]

  let aliasRegistry

  before(async () => {
    aliasRegistry = await AliasRegistry.deployed()
    // aliasRegistry = await AliasRegistry.new({from: owner})
    console.log('aliasRegistry.address', aliasRegistry.address)  
  
  })

  describe('set identity', () => {
      
    it('should be able to set a new identity', async () => {
        
      const tx = await aliasRegistry.setIdentity(user1, {from: owner})
      const log = tx.logs[0]
      
      console.log('[log]: ', log)

    })
      
  })

})

const TestRPC = require('ganache-cli')
const HDWalletProvider = require('truffle-hdwallet-provider')
const mnemonic = 'auction tourist gloom common fringe indoor flower position grape bench imitate icon'

// Truffle setup
const truffleSetup = {
  migrations_directory: './migrations',
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      onlyCalledMethods: true
    }
  },
  networks: {
    test: {
      provider: TestRPC.provider({port: 7545}),
      network_id: '*' // Match any network id
    },
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Match any network id
    },
    d: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'http://35.80.248.156:8545')
      },
      network_id: '*'
    },
    sing: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'http://54.218.118.181:8545')
      },
      network_id: '*'
    },    
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/v3/3a0c0f8b7bf7435ba9ec3b440eaa403e')
      },
      network_id: 4
    }
  },
  solc: { optimizer: { enabled: true, runs: 200 } }
}

module.exports = truffleSetup

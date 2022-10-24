require('dotenv').config({ path: `${__dirname}/../.env` })
const HDWalletProvider = require('@truffle/hdwallet-provider')
const mnemonic = process.env.PK

// Truffle setup
const truffleSetup = {
  migrations_directory: './migrations',
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      onlyCalledMethods: true
    }
  },
  networks: {
    // test: {
    //   provider: TestRPC.provider({port: 7545}),
    //   network_id: '*' // Match any network id
    // },
    development: {
      host: 'localhost',
      port: 7545,
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
    },
    goerli: {
      provider: () => {
        return new HDWalletProvider(mnemonic, 'https://goerli.infura.io/v3/94fe488040a04886ae523a1ad2a2bd99')
      },
      network_id: 5
    }
  },
  compilers: {
    solc: {
      version: "0.4.23",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: "PQ83YGQG8YE4GZMMQ52D8SRF7ECRSX28HP"
  },
}

module.exports = truffleSetup
// https://mainnet.infura.io/v3/3a0c0f8b7bf7435ba9ec3b440eaa403e
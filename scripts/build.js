const chalk = require('chalk')
const startGanache = require('./helpers/start-ganache')
// const buildContracts = require('./helpers/build-contracts')
const deployContracts = require('./helpers/deploy-contracts')
const startIpfs = require('./helpers/start-ipfs')
// const startTestServer = require('./helpers/start-test-server')
const watch = require('node-watch')
const webpack = require('webpack')
const webpackConfig = require('../webpack.config.js')

const args = process.argv.slice(2)
const shouldWatch = args.length && args[0] === 'serve'
const network = args.length && args[1]
console.log(network)
const start = async () => {
  const compiler = webpack(webpackConfig)

  if (shouldWatch) {
    if (network === 'development') {
      console.log(chalk`\n{bold.hex('#1a82ff') Starting Local Blockchain }\n`)
      await startGanache()

      console.log(chalk`\n{bold.hex('#26d198') Starting Local IPFS }\n`)
      await startIpfs()

    } else {

      console.log(chalk`\n{bold.hex('#26d198') Starting Local IPFS }\n`)
      await startIpfs()
  
    }

    console.log(chalk`\n{bold.hex('#26d198') Deploying Smart Contracts }\n`)
    await deployContracts(network)
  

    // watch contracts
    watch('./contracts/contracts', { recursive: true }, (evt, name) => {
      console.log('%s changed.', name)
      deployContracts(network)
    })

    // watch js
    compiler.watch({}, (err, stats) => {
      if (err) {
        console.error('watch error', err)
      } else {
        console.log(new Date().toISOString(), 'D', stats)
      }
    })

    // console.log(chalk`\n{bold.hex('#26d198') Starting Test Server }\n`)
    // startTestServer()

  } else {

    if (network !== undefined) {
      // commented out for beta/prod npm publish so we keep the same contract addresses
      // console.log(chalk`\n{bold.hex('#26d198') Compiling Smart Contracts }\n`)
      // await buildContracts()

      // console.log(chalk`\n{bold.hex('#26d198') Deploying Smart Contracts }\n`)
      // await deployContracts(network)
    }

    console.log(chalk`\n{bold.hex('#26d198') Compiling Webpack }\n`)
    compiler.run(err => {
      if (err) {
        console.log('webpack compile error', err)
      } else {
        console.log(chalk`\n{bold.hex('#26d198') Webpack compiled successfully }\n`)
      }
    })
  }
}

start()

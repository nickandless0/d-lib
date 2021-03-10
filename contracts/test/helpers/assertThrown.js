const Promise = require('bluebird')
web3.version = Promise.promisifyAll(web3.version)

async function assertThrown(errorThrown, message) {
  const netver = await web3.version.getNetworkAsync()
  if (netver !== '9090') {
    assert.isTrue(errorThrown, message)
  }
}

module.exports = assertThrown

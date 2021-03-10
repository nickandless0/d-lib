const Ganache = require('ganache-core')

const PORT = 8545

const startGanache = () => {
  return new Promise((resolve, reject) => {
    const server = Ganache.server({
      total_accounts: 6,
      default_balance_ether: 100,
      network_id: 999,
      // seed: 123,
      blocktime: 0,
      gasPrice: 0x01,
      gasLimit: 0xfffffffffff,
      // mnemonic: 'stereo jelly wise dwarf shock reveal youth jeans panther adapt state sheriff',
      mnemonic: 'auction tourist gloom common fringe indoor flower position grape bench imitate icon',
    })
    server.listen(PORT, err => {
      if (err) {
        return reject(err)
      }
      console.log(`Ganache listening on port ${PORT}`)
      resolve()
    })
  })
}

module.exports = startGanache

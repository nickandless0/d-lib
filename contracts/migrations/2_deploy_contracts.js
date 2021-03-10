
// ERC725, ERC735 Identity
const AliasRegistry = artifacts.require('./Identity/AliasRegistry.sol')
const IdentityRegistry = artifacts.require('./Identity/IdentityRegistry.sol')
const Delegate = artifacts.require('./Identity/Delegate.sol')

module.exports = function(deployer, network, accounts) {
  console.log(network)
  console.log(accounts)
  return deployer.then(() => {
    return deployContracts(deployer)
  })
}

async function deployContracts(deployer) {
  await deployer.deploy(AliasRegistry)
  await deployer.deploy(IdentityRegistry)
  await deployer.deploy(Delegate)
}

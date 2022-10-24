
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
  const aliasRegistry = await deployer.deploy(AliasRegistry);
  console.log('aliasRegistry address', aliasRegistry.address)
  const identityRegistry = await deployer.deploy(IdentityRegistry);
  console.log('identityRegistry address', identityRegistry.address)
  const delegate = await deployer.deploy(Delegate);
  console.log('delegate address', delegate.address)
}

import {
  ethers
} from 'ethers'

/**
 * Create a pre-funded wallet with all defaults
 *
 * @param provider The provider to connect to the created wallet and to withdraw funds from
 * @param accountIndex The account index of the corresponding wallet derivation path
 */
export async function createFundedWallet(provider, accountIndex) {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = createWallet(provider, accountIndex)
      const receipt = await fundWallet(wallet, provider)
      resolve({
        wallet,
        receipt
      })
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Create an ethers.js wallet instance that is connected to the given provider
 *
 * @param provider A compatible ethers.js provider such as the one returned by `ganache.provider()` to connect the wallet to
 * @param accountIndex The account index to derive from the mnemonic phrase
 */
export function createWallet(provider, accountIndex) {
  if (accountIndex < 0) {
    throw Error(`Account index must be greater than 0, got ${accountIndex}`)
  }

  /**
   * THIS IS FOR TESTING PURPOSES ONLY
   */
  const mnemonicPhrase = ''

  const path = `m/44'/60'/${accountIndex}'/0/0`
  console.debug('created wallet with parameters: %o', {
    mnemonicPhrase,
    path
  })

  return ethers.Wallet.fromMnemonic(mnemonicPhrase, path).connect(provider)
}

/**
 * Fund a wallet with unlocked accounts available from the given provider
 *
 * @param wallet The ethers wallet to fund
 * @param provider The provider which has control over unlocked, funded accounts to transfer funds from
 * @param overrides Transaction parameters to override when sending the funding transaction
 */
export async function fundWallet(wallet, provider, overrides) {
  return new Promise(async (resolve, reject) => {
    try {

      console.debug('funding wallet')

      console.debug('retreiving accounts...')

      const nodeOwnedAccounts = await provider.listAccounts()
      console.debug('retreived accounts: %o', nodeOwnedAccounts)

      const signer = provider.getSigner(nodeOwnedAccounts[0])

      const txParams = {
        to: wallet.address,
        value: ethers.utils.parseEther('10'),
        ...overrides,
      }
      console.debug('sending tx with the following parameters: %o', txParams)

      const tx = await signer.sendTransaction(txParams)
      console.debug('waiting on tx %s to complete...', tx.hash)

      const receipt = await tx.wait()
      console.debug('tx %s confirmed with tx receipt %o', tx.hash, receipt)

      resolve(receipt)

    } catch (e) {
      reject(e)
    }
  })
}
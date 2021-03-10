/*
  Simple Signer
*/

import { ec as EC } from 'elliptic'
import { sha256 } from './digest'

const secp256k1 = new EC('secp256k1')

function leftpad (data, size = 64) {
  if (data.length === size) return data
  return '0'.repeat(size - data.length) + data
}

function SimpleSigner (hexPrivateKey) {
  const privateKey = secp256k1.keyFromPrivate(hexPrivateKey)
  return async (data) => {
    const {r, s, recoveryParam} = privateKey.sign(sha256(data))
    return {
      r: leftpad(r.toString('hex')),
      s: leftpad(s.toString('hex')),
      recoveryParam
    }
  }
}

export { SimpleSigner }

/*
  Jsonwebtoken Validations
*/
import { isMNID } from './mnid'
import { Verifier } from './verifier'
import { Signer } from './signer'
import base64url from 'base64url'
import { resolve } from '../resolver'

import { register } from '../did'

register()

const SUPPORTED_PUBLIC_KEY_TYPES = {
  ES256K: [
    'Secp256k1VerificationKey2018',
    'Secp256k1SignatureVerificationKey2018',
    'EcdsaPublicKeySecp256k1'
  ],
  'ES256K-R': [
    'Secp256k1VerificationKey2018',
    'Secp256k1SignatureVerificationKey2018',
    'EcdsaPublicKeySecp256k1'
  ]
}

const JWT_HEADER = {
  typ: 'JWT'
}

const defaultAlg = 'ES256K'

function encodeSection(data) {
  return base64url.encode(JSON.stringify(data))
}

export const IAT_SKEW = 300

function isDIDOrMNID(mnidOrDid) {
  return mnidOrDid && (mnidOrDid.match(/^did:/) || isMNID(mnidOrDid))
}

export function normalizeDID(mnidOrDid) {
  if (mnidOrDid.match(/^did:/)) return mnidOrDid
  if (isMNID(mnidOrDid)) return `did:d:${mnidOrDid}`
  throw new Error(`Not a valid DID '${mnidOrDid}'`)
}

export function decodeJWT(jwt) {
  if (!jwt) throw new Error('no JWT passed into decodeJWT')
  const parts = jwt.match(/^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/)
  if (parts) {
    return {
      header: JSON.parse(base64url.decode(parts[1])),
      payload: JSON.parse(base64url.decode(parts[2])),
      signature: parts[3],
      data: `${parts[1]}.${parts[2]}`
    }
  }
  throw new Error('Incorrect format JWT')
}

export async function createJWT(payload, {
  issuer,
  signer,
  alg,
  expiresIn
}) {
  if (!signer) throw new Error('No Signer functionality has been configured')
  if (!issuer) throw new Error('No issuing DID has been configured')
  const header = {
    ...JWT_HEADER,
    alg: alg || defaultAlg
  }
  const timestamps = {
    iat: Math.floor(Date.now() / 1000)
  }
  if (expiresIn) {
    if (typeof expiresIn === 'number') {
      timestamps.exp = timestamps.iat + Math.floor(expiresIn)
    } else {
      throw new Error('JWT expiresIn is not a number')
    }
  }
  const signingInput = [encodeSection(header),
    encodeSection({
      ...timestamps,
      ...payload,
      iss: issuer
    })
  ].join('.')

  const jwtSigner = Signer(header.alg)
  const signature = await jwtSigner(signingInput, signer)
  return [signingInput, signature].join('.')
}

export async function verifyJWT(jwt, options = {}) {
  const aud = options.audience ? normalizeDID(options.audience) : undefined
  const {
    payload,
    header,
    signature,
    data
  } = decodeJWT(jwt)
  const {
    doc,
    authenticators,
    issuer
  } = await resolveAuthenticator(header.alg, payload.iss, options.auth)
  const signer = Verifier(header.alg)(data, signature, authenticators)
  const now = Math.floor(Date.now() / 1000)
  if (signer) {
    if (payload.iat && payload.iat > (now + IAT_SKEW)) {
      throw new Error(`JWT not valid yet (issued in the future): iat: ${payload.iat} > now: ${now}`)
    }
    if (payload.exp && (payload.exp <= (now - IAT_SKEW))) {
      throw new Error(`JWT has expired: exp: ${payload.exp} < now: ${now}`)
    }
    if (payload.aud) {
      if (isDIDOrMNID(payload.aud)) {
        if (!aud) {
          throw new Error('JWT audience is required but your app address has not been configured')
        }

        if (aud !== normalizeDID(payload.aud)) {
          throw new Error(`JWT audience does not match your DID: aud: ${payload.aud} !== yours: ${aud}`)
        }
      } else {
        if (!options.callbackUrl) {
          throw new Error('JWT audience matching your callback url is required but one wasn\'t passed in')
        }
        if (payload.aud !== options.callbackUrl) {
          throw new Error(`JWT audience does not match the callback url: aud: ${payload.aud} !== url: ${options.callbackUrl}`)
        }
      }
    }
    return ({
      payload,
      doc,
      issuer,
      signer,
      jwt
    })
  } else {

  }
}

export async function resolveAuthenticator(alg, mnidOrDid, auth) {
  const types = SUPPORTED_PUBLIC_KEY_TYPES[alg]
  if (!types || types.length === 0) throw new Error(`No supported signature types for algorithm ${alg}`)
  const issuer = normalizeDID(mnidOrDid)
  const doc = await resolve(issuer)
  if (!doc) throw new Error(`Unable to resolve document for ${issuer}`)
  const authenticationKeys = auth ? (doc.authentication || []).map(({
    publicKey
  }) => publicKey) : true
  const authenticators = (doc.publicKey || []).filter(({
    type,
    id
  }) => types.find(supported => supported === type && (!auth || authenticationKeys.indexOf(id) >= 0)))

  if (auth && (!authenticators || authenticators.length === 0)) throw new Error(`DID document for ${issuer} does not have public keys suitable for authenticationg user`)
  if (!authenticators || authenticators.length === 0) throw new Error(`DID document for ${issuer} does not have public keys for ${alg}`)
  return {
    authenticators,
    issuer,
    doc
  }
}

export default {
  decodeJWT,
  createJWT,
  verifyJWT,
  resolveAuthenticator
}
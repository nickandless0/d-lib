/*
  Universal Resolver
*/
export class DIDDocument {
  constructor({ id, publicKey, authentication, profile, service } = {}) {
    this.context = '@context: https://w3id.org/did/v1'
    this.id = id
    this.publicKey = publicKey
    this.authentication = authentication
    this.profile = profile
    this.service = service
  }
}

export class ServiceEndpoint {
  constructor({ id, type, serviceEndpoint, description } = {}) {
    this.id = id
    this.type = type
    this.serviceEndpoint = serviceEndpoint
    this.description = description
  }
}

export class PublicKey {
  constructor({
    id,
    type,
    owner,
    ethereumAddress,
    publicKeyBase64,
    publicKeyBase58,
    publicKeyHex,
    publicKeyPem
  } = {}) {
    this.id = id
    this.type = type
    this.owner = owner
    this.ethereumAddress = ethereumAddress
    this.publicKeyBase64 = publicKeyBase64
    this.publicKeyBase58 = publicKeyBase58
    this.publicKeyHex = publicKeyHex
    this.publicKeyPem = publicKeyPem
  }
}

export class Authentication {
  constructor({ type, publicKey } = {}) {
    this.type = type
    this.publicKey = publicKey
  }
}

export class ParsedDID {
  constructor({ did, method, id, path, fragment } = {}) {
    this.did = did
    this.method = method
    this.id = id
    this.path = path
    this.fragment = fragment
  }
}

export class DIDResolver {
  constructor({ did, parsed } = {}) {
    this.did = did
    this.parsed = parsed
  }
}

class ResolverRegistry {
  constructor({ index } = {}) {
    this.index = index
  }
}

let DID_REGISTRY = {}
let REGISTRY = {}

if (typeof window === 'object') {
  DID_REGISTRY = window
} else if (typeof global === 'object') {
  DID_REGISTRY = global
} else {
  DID_REGISTRY = {}
}

if (DID_REGISTRY) {
  REGISTRY = DID_REGISTRY
} else {
  REGISTRY = {}
}

export function registerMethod(method, resolver) {
  REGISTRY[method] = resolver
}

export function parse(did) {
  if (did === '') throw new Error('DID not received')
  const sections = did.match(/^did:([a-zA-Z0-9_]+):([[a-zA-Z0-9_.-]+)(\/[^#]*)?(#.*)?$/)
  if (sections) {
    const parts = { did: sections[0], method: sections[1], id: sections[2] }
    if (sections[3]) parts.path = sections[3]
    if (sections[4]) parts.fragment = sections[4].slice(1)
    return parts
  }
  throw new Error(`Invalid DID ${did}`)
}

export async function resolve(did) {
  const parsed = parse(did)
  const resolver = REGISTRY[parsed.method]
  if (resolver) {
    return await resolver(did, parsed)
  }
  throw new Error(`Invalid P2P Method: '${parsed.method}'`)
}

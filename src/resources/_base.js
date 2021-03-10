export class ResourceBase {
  constructor({ chainService, ipfsService }) {
    this.chainService = chainService
    this.ipfsService = ipfsService
  }
}

export class AliasesObject {
  constructor({
    aliases
  } = {}) {
    this.aliases = aliases
  }
}

export class AliasObject {
  constructor({
    alias,
    identity,
    timestamp,
    burner,
    expiry,
    nonce,
    enabled,
    tx,
    elapsed
  } = {}) {
    this.alias = alias,
    this.identity = identity,
    this.timestamp = timestamp,
    this.burner = burner,
    this.expiry = expiry,
    this.nonce = nonce,
    this.enabled = enabled,
    this.tx = tx,
    this.elapsed = elapsed
  }
}

export class AssetObject {
  constructor({
    asset,
    store,
    tx,
    elapsed
  } = {}) {
    this.asset = asset
    this.store = store
    this.tx = tx
    this.elapsed = elapsed
  }
}

export class GetAssetObject {
  constructor({
    asset,
    store,
    elapsed
  } = {}) {
    this.asset = asset
    this.store = store
    this.elapsed = elapsed
  }
}

export class AssetsObject {

  constructor({
    assets,
    elapsed
  } = {}) {
    this.assets = assets
    this.elapsed = elapsed
  }
}

export class TransferObject {
  constructor({
    asset,
    previousOwner,
    newOwner,
    elapsed
  } = {}) {
    this.asset = asset,
    this.previousOwner = previousOwner,
    this.newOwner = newOwner,
    this.elapsed = elapsed
  }
}

const claimTypeMapping = {
  1: 'self',
  2: 'phone',
  3: 'email',
  4: 'asset',
  5: 'patent',
  6: 'securedisclosure',
  7: 'share'
}

export class AttestationObject {
  constructor({
    claimType,
    data,
    signature,
    metadata,
    version
  } = {}) {
    this.claimType = claimType
    this.data = data
    this.signature = signature
    this.metadata = metadata,
    this.service = claimTypeMapping[claimType]
    this.version = version
  }
}

export class AuthObject {
  constructor({
    subject,
    audience,
    type,
    elapsed,
    action,
    tx
  } = {}) {
    this.subject = subject,
    this.audience = audience,
    this.type = type,
    this.elapsed = elapsed,
    this.action = action,
    this.tx = tx
  }
}

export class DocObject {
  constructor({
    base64,
    store,
    elapsed
  } = {}) {
    this.base64 = base64
    this.store = store
    this.elapsed = elapsed
  }
}

export class ErrorObject {
  constructor({
    message,
    stack
  } = {}) {
    this.message = message
    this.stack = stack
  }
}

export class IdentityObject {
  constructor({
    identity,
    store,
    aliases,
    active,
    profile,
    elapsed,
    tx
  } = {}) {
    this.identity = identity,
    this.store = store,
    this.aliases = aliases,
    this.active = active,
    this.profile = profile,
    this.elapsed = elapsed,
    this.tx = tx
  }
}

export class LogObject {
  constructor({
    payload
  } = {}) {
    this.payload = payload
  }
}

export class ServiceObject {
  constructor({
    subject,
    audience,
    payload,
    elapsed,
    tx
  } = {}) {
    this.subject = subject,
    this.audience = audience,
    this.payload = payload,
    this.elapsed = elapsed,
    this.tx = tx
  }
}

export class LoginObject {
  constructor({
    profile,
    identity,
    active,
    auth,
    elapsed,
    tx
  } = {}) {
    this.profile = profile
    this.identity = identity,
    this.active = active,
    this.auth = auth,
    this.elapsed = elapsed,
    this.tx = tx
  }
}

export class LogoutObject {
  constructor({
    identity,
    elapsed
  } = {}) {
    this.identity = identity,
    this.elapsed = elapsed    
  }
}

export class SessionObject {
  constructor({
    identity,
    active,
    token,
    expiry,
    elapsed
  } = {}) {
    this.identity = identity,
    this.active = active,
    this.token = token,
    this.expiry = expiry,
    this.elapsed = elapsed
  }
}

export class ShareObject {
  constructor({
    store,
    message,
    elapsed
  } = {}) {
    this.store = store
    this.message = message
    this.elapsed = elapsed
  }
}

export class ResponseObject {
  constructor({
    success
  } = {}) {
    this.success = success
  }
}
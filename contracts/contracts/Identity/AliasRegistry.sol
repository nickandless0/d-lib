pragma solidity 0.4.23;

contract Ownable {
  address public owner;

  event OwnerTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  constructor()
    public
  {
    owner = msg.sender;
  }

  modifier onlyOwner()
  {
    require(msg.sender == owner,"");
    _;
  }

  function transferOwner(
    address _newOwner
  )
    public
    onlyOwner
  {
    require(_newOwner != address(0),"");
    emit OwnerTransferred(owner, _newOwner);
    owner = _newOwner;
  }

}

contract AliasRegistry is Ownable {

  struct Identity
  {
    uint index;
    bytes32 store;
    bool active;
    bytes32[] aliases;
    mapping(bytes32 => uint) aliasIndex;
  }

  mapping(address => Identity) private identities;
  address[] private identityList;

  struct Aliases
  {
    uint index;
    address identityAddress;
    uint createdAt;
    uint updatedAt;
    bool burner;
    uint expiry;
    bool nonce;
    bool active;
  }

  mapping(bytes32 => Aliases) public aliases;
  bytes32[] private aliasList;

  event LogNewIdentity(
    address sender,
    address identityAddress
  );

  event LogNewAlias(
    address sender,
    bytes32 alias,
    address identityAddress,
    uint createdAt,
    uint updatedAt,
    bool burner,
    uint expiry,
    bool nonce,
    bool active
  );

  event LogAliasUpdated(
    address sender,
    bytes32 alias,
    uint updatedAt
  );

  function getIdentityCount()
    public
    view
  returns(uint identityCount)
  {
    return identityList.length;
  }

  function getAliasCount()
    public
    view
  returns(uint aliasCount)
  {
    return aliasList.length;
  }

  function isIdentity(
    address identityAddress
  )
    public
    view
  returns(bool success)
  {
    if (identityList.length == 0) return false;
    return identityList[identities[identityAddress].index] == identityAddress;
  }

  function isAlias(
    bytes32 alias
  )
    public
    view
  returns(bool success)
  {
    if (aliasList.length == 0) return false;
    return aliasList[aliases[alias].index] == alias;
  }

  function getAliasesByIdentitiesCount(
    address identityAddress
  )
    public
    view
  returns(uint aliasCount)
  {
    require(isIdentity(identityAddress), "Identity not registered");

    return identities[identityAddress].aliases.length;
  }

  function getIdentityAliasAtIndex(
    address identityAddress,
    uint index
  )
    public
    view
  returns(bytes32 alias)
  {
    require(isIdentity(identityAddress), "Identity not registered");
    return (identities[identityAddress].aliases[index]);
  }

  function setIdentity(
    address identityAddress,
    bytes32 store,
    bool active
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(!isIdentity(identityAddress), "Identity already registered");

    identities[identityAddress].index = identityList.push(identityAddress) - 1;
    identities[identityAddress].store = store;
    identities[identityAddress].active = active;

    emit LogNewIdentity(msg.sender, identityAddress);
  
    return true;
  }

  function setIdentityStore(
    address identityAddress,
    bytes32 store
  )
    public
    onlyOwner
  {
    identities[identityAddress].store = store;
  }

  function setIdentityActive(
    address identityAddress,
    bool active
  )
    public
    onlyOwner
  {
    identities[identityAddress].active = active;
  }

  function getIdentity(
    address identityAddress
  )
    external
    view
    returns(bytes32, bytes32[], bool)
  {
    return (
      identities[identityAddress].store,
      identities[identityAddress].aliases,
      identities[identityAddress].active);
  }

  function setAlias(
    bytes32 alias,
    address identityAddress,
    bool burner,
    uint expiry,
    bool nonce
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(isIdentity(identityAddress), "Identity not registered");
    require(!isAlias(alias), "Alias already exists");
  
    uint timestamp = block.timestamp;
  
    aliases[alias].index = aliasList.push(alias) - 1;
    aliases[alias].identityAddress = identityAddress;
    aliases[alias].createdAt = timestamp;
    aliases[alias].updatedAt = timestamp;
    aliases[alias].burner = burner;
    aliases[alias].expiry = expiry;
    aliases[alias].nonce = nonce;
    aliases[alias].active = true;

    identities[identityAddress].aliasIndex[alias] = identities[identityAddress].aliases.push(alias) - 1;

    emit LogNewAlias(
      msg.sender,
      alias,
      identityAddress,
      timestamp,
      timestamp,
      burner,
      expiry,
      nonce,
      true
    );

    return true;
  }

  function setAliasActive(
    bytes32 alias,
    bool active
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(isAlias(alias), "Alias not found");

    uint timestamp = block.timestamp;

    aliases[alias].active = active;

    aliases[alias].updatedAt = timestamp;

    emit LogAliasUpdated(msg.sender, alias, timestamp);

    return true;
  }

  function setIdentityAliasAtIndex(
    address identityAddress,
    uint index,
    bool active
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(isIdentity(identityAddress), "Identity not registered");

    uint timestamp = block.timestamp;

    bytes32 _alias = identities[identityAddress].aliases[index];

    if(aliases[_alias].burner) {
      if(aliases[_alias].nonce == true || aliases[_alias].expiry < timestamp) {
        aliases[_alias].active = false;
      }
    } else {
      aliases[_alias].active = active;
    }

    aliases[_alias].updatedAt = timestamp;

    emit LogAliasUpdated(msg.sender, _alias, timestamp);

    return true;
  }

}
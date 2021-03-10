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

contract IdentityRegistry is Ownable {

  struct Identity
  {
    uint index;
    bytes32[] logs;
    mapping(bytes32 => uint) logIndex;
  }

  mapping(address => Identity) private identities;
  address[] private identityList;

  struct Logs
  {
    uint index;
    address subject;
    address audience;
    uint createdAt;
    bytes32 store;
    bytes32 logType;
    bytes32 txn;
  }

  mapping(bytes32 => Logs) public logs;
  bytes32[] private logsList;

  event NewIdentity(
    address sender,
    address subject
  );

  event NewLog(
    address sender,
    address subject,
    address audience,
    uint createdAt,
    bytes32 store,
    bytes32 logType
  );

  event UpdateLog(
    bytes32 store,
    bytes32 txn
  );

  function getIdentityCount()
    public
    view
  returns(uint identityCount)
  {
    return identityList.length;
  }

  function getLogCount()
    public
    view
  returns(uint logCount)
  {
    return logsList.length;
  }

  function isIdentity(
    address subject
  )
    public
    view
  returns(bool success)
  {
    if (identityList.length == 0) return false;
    return identityList[identities[subject].index] == subject;
  }

  function getLogsByIdentitiesCount(
    address subject
  )
    public
    view
  returns(uint logCount)
  {
    require(isIdentity(subject), "Identity not registered");

    return identities[subject].logs.length;
  }

  function getIdentityLogAtIndex(
    address subject,
    uint index
  )
    public
    view
  returns(bytes32 log)
  {
    require(isIdentity(subject), "Identity not registered");
    return (identities[subject].logs[index]);
  }

  function setIdentity(
    address subject
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(!isIdentity(subject), "Identity already registered");

    identities[subject].index = identityList.push(subject) - 1;

    emit NewIdentity(msg.sender, subject);

    return true;
  }

  function getIdentity(
    address subject
  )
    external
    view
    returns(bytes32[])
  {
    return (identities[subject].logs);
  }

  function setLog(
    address subject,
    address audience,
    bytes32 store,
    bytes32 logType
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(isIdentity(subject), "Identity not registered");

    uint timestamp = block.timestamp;

    logs[store].index = logsList.push(store) - 1;
    logs[store].subject = subject;
    logs[store].audience = audience;
    logs[store].createdAt = timestamp;
    logs[store].store = store;
    logs[store].logType = logType;

    identities[subject].logIndex[store] = identities[subject].logs.push(store) - 1;

    emit NewLog(
      msg.sender,
      subject,
      audience,
      timestamp,
      store,
      logType
    );

    return true;
  }

  function isLog(
    bytes32 store
  )
    public
    view
  returns(bool success)
  {
    if (logsList.length == 0) return false;
    return logsList[logs[store].index] == store;
  }

  function setLogTx(
    bytes32 store,
    bytes32 txn
  )
    public
    onlyOwner
  returns(bool success)
  {
    require(isLog(store), "Log not found");

    logs[store].txn = txn;

    emit UpdateLog(store, txn);

    return true;
  }

}
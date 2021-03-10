/*
  Contract Factory
*/
const isTransactionObject = (txObj) => {
  const txObjectProperties = ['from', 'to', 'data', 'value', 'gasPrice', 'gas']
  if (typeof txObj !== 'object') return false

  if (Object.keys(txObj).length === 0) return true

  for (const prop of txObjectProperties) {
    if (prop in txObj) return true
  }

  return false
}

const getCallableMethodsFromABI = (contractABI) => {
  return contractABI.filter((json) => ((json.type === 'function' || json.type === 'event') && json.name.length > 0))
}

const encodeMethodReadable = (methodObject, methodArgs) => {
  let dataString = `${methodObject.name}(`

  for (let i = 0; i < methodObject.inputs.length; i++) {
    const input = methodObject.inputs[i]
    let argString = `${input.type} `

    if (input.type === 'string') {
      argString += `"${methodArgs[i]}"`
    } else if (input.type === ( 'bytes32' || 'bytes')) {
      argString += `${methodArgs[i]}`
    } else {
      argString += `${methodArgs[i]}`
    }

    dataString += argString

    if ((methodObject.inputs.length - 1) !== i) {
      dataString += `, `
    }
  }
  return dataString += `)`
}

export const ContractFactory = (extend) => (contractABI) => {
  const output = {}
  output.at = function atContract(address) {

    function Contract() {
      const self = this
      self.abi = contractABI || []
      self.address = address || '0x'

      getCallableMethodsFromABI(contractABI).forEach((methodObject) => {
        self[methodObject.name] = function contractMethod() {

          if (methodObject.constant === true) {
            throw new Error('A call does not return the txobject, no transaction necessary.')
          }

          if (methodObject.type === 'event') {
            throw new Error('An event does not return the txobject, events not supported')
          }

          let providedTxObject = {}
          const methodArgs = [].slice.call(arguments)
          const nArgs = methodObject.inputs.length

          if (methodObject.type === 'function') {

            if (isTransactionObject(methodArgs[nArgs])) {
              providedTxObject = methodArgs.splice(nArgs, 1)[0]
            }

            const methodTxObject = {
              ...providedTxObject,
              to: self.address,
              function: encodeMethodReadable(methodObject, methodArgs)
            }

            if (!extend) return methodTxObject

            const extendArgs = methodArgs.slice(nArgs)
            return extend(methodTxObject, ...extendArgs)
          }
        }
      })
    }

    return new Contract()
  }

  return output
}

import { pollFilter } from './../filter/poll';
import { ITransactionObject } from './../node/typings';
import { handleInit, handleCall, handleSend } from './function/handlers';
import { IProxiedNode } from './../node/index';
import { ConstructorFactory, FunctionFactory } from './function/factories';
import { objReduce } from './function/components/utils';
import { IAbiBehaviour, 
         IFunctionFactory,
         IOutputMappings, 
         Contract, 
         IAbiConstructor, 
         AbiMethodTypes, 
         ConstructorCall, 
         Selector, 
         IAbiFunction, 
         IFuncOutputMappings, 
         IContract, 
         ConstructorArguments } from './typings';

export * from './typings'

export const CreateContract = <T>(
  abi: IAbiBehaviour[],
  outputMappings: IOutputMappings = {}
) => {
  const reducer = (compiledContract: Contract, currMethod: IAbiBehaviour) => {
    const { name, type } = currMethod
    const handler = selector[type];
    switch(type){
      case(AbiMethodTypes.function):
        return {
          ...compiledContract,
          [name]: handler(currMethod, outputMappings[name])
        }
      case(AbiMethodTypes.constructor):
        return {
          ...compiledContract,
          [ConstructorCall]: handler(currMethod)
        }
    }
  }
  const contract = objReduce(abi, reducer);
  return contract as T;
};

export const ContractInstance = async <T, K = {}>(contract: IContract, node: IProxiedNode, args: ConstructorArguments<K>) => {
  const { parameters, txObj } = args
  if(typeof parameters === 'string'){
    const response = await node.eth_getCode(parameters);
    if(response === '0x0'){
      throw Error('could not find contract at given address')
    }
    return ConnectedContract(contract, node, parameters) as T
  } else if(txObj && txObj.data) {
    if(contract[ConstructorCall]){
      const constructorFunction = contract[ConstructorCall]
      const address = await handleInit({parameters, constructorFunction, node, txObj})
      return ConnectedContract(contract, node, address) as T
    } else {
      const address = await handleInit({node, txObj})
      return ConnectedContract(contract, node, address) as T
    }
  } else {
    throw Error('could not instantiate a contract from those arguments, either pass a compiled contract through the data of the txObject, or the address of a deployed contract')
  }
}

const ConnectedContract = <T>(
  contract: IContract,
  node: IProxiedNode,
  address: string,
  defaultTxObj: Partial<ITransactionObject> = {
    to: address
  }
) => {
  const routeCalls = {
    get(target: IContract, propKey: any) {
      if(propKey === 'address'){
        return address
      }
      if (!Object.getOwnPropertyNames(contract).includes(propKey)) {
        return contract[propKey];
      }
      const contractBehaviour: IFunctionFactory = contract[propKey];
      if (!contractBehaviour) {
        throw Error(`${propKey} is not a valid contract method`);
      }
      if (contractBehaviour.type.toString() === AbiMethodTypes.constructor){
        throw Error('cannot directly invoke constructor or fallback on a deployed instance')
      }
      return (
        userArgs: any[],
        txObj: ITransactionObject
      ) => {
          const isConstant = contractBehaviour.constant;
          const isParamless = contractBehaviour.paramless;
          const mergedTxObj = isParamless
          ? { ...defaultTxObj, ...userArgs }
          : { ...defaultTxObj, ...txObj }
          const methodArgs: any = { //TODO fix issue between ICallTxObj and methodArgs
            func: contractBehaviour,
            node,
            txObj: mergedTxObj,
            userArgs: isParamless ? null : userArgs
          };
          return isConstant ? handleCall(methodArgs) : handleSend(methodArgs);
      };
    }
  };
  return new Proxy(contract, routeCalls) as T;
};

export const checkForContractAddress = async (node: IProxiedNode, txHash: string, timeout?: number) => {
  const count = timeout ? timeout : 50
  for(let i = 0; i < count; i++){
    const response = await pollFilter(node);
    if(response){
      const result = await node.eth_getTransactionReceipt(txHash)
      if(result.contractAddress){
        return result.contractAddress;
      }
    }
  }
  throw Error(`could not find the transaction receipt after ${count} blocks`)
}

const selector: Selector = {
  [AbiMethodTypes.function]: (
    abiFunc: IAbiFunction,
    outputMappings: IFuncOutputMappings
  ) => FunctionFactory(abiFunc, outputMappings),

  [AbiMethodTypes.constructor]: (
    abiFunc: IAbiConstructor,
  ) => ConstructorFactory(abiFunc),
};

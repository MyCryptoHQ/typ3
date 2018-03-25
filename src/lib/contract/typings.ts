import { IFilterLog } from './../node/typings';
import { ITransactionObject, IProxiedNode } from '../node';
export type IAbiBehaviour = IAbiConstructor | IAbiFunction
export type IFuncOutputMappings = string[];
export type IBehaviour = IFunctionFactory | IEventFactory

export const ConstructorCall = 'new'  //TODO move this

export enum AbiMethodTypes {
  function = 'function',
  event = 'event',
  constructor = 'constructor',
  filter = 'filter'
}

//TODO add stricter typing. TS wont throw if abi is used in place of Contract argument in ContractInstance factory, which may be a common problem
export interface IContract {
  [behaviour: string]: any
}

export interface IHandleCallParams {
  userArgs: any[] | undefined;
  txObj: ITransactionObject
  func: IFunctionFactory;
  node: IProxiedNode;
}

export interface IHandleSendParams extends IHandleCallParams {
  txObj: ITransactionObject;
}

export interface IHandleInitParams {
  node: IProxiedNode;
  txObj: ITransactionObject;
  constructorFunction?: IConstructorFactory;
  parameters?: object | undefined;
}

export interface ConstructorArguments<K> {
  parameters?: string | K,
  txObj?: ITransactionObject
}

export interface ArgumentsObject {
  [name: string]: string
}

export interface IOutputMappings {
  [abiFuncName: string]: string[];
}

export interface Selector {
  [AbiMethodTypes.function]: any
  [AbiMethodTypes.constructor]: any
}

export interface Contract {
  [name: string]: IAbiBehaviour
}

export interface IO {
  name: string,
  type: string 
};

export interface IndexedIO extends IO {
  indexed: boolean
}
export interface IFunctionFactory {
  type: AbiMethodTypes.function;
  constant: boolean;
  paramless: boolean;
  decodeArguments(args: string):IDecode;
  decodeReturnValue(ret: string):IDecode;
  encodeArguments(args: any):string;
}

export interface IConstructorFactory {
  type: AbiMethodTypes.constructor
  paramless: boolean;
  encodeArguments(args: any, byteCode: string | undefined): string;
}

export interface IEventFactory {
  type: AbiMethodTypes.event;
  decodeArguments(log: IFilterLog): IDecode;
}

export interface IAbiFunction {
  type: AbiMethodTypes.function;
  name: string;
  inputs: IO[];
  outputs: IO[];
  constant: boolean;
  payable: boolean;
}

export interface IAbiConstructor {
  name: 'new'
  type: AbiMethodTypes.constructor
  inputs: IO[]
  payable: boolean
}

export interface IAbiEvent {
  name: string
  type: AbiMethodTypes.event
  inputs: IndexedIO[]
  anonymous: boolean
}

export interface IAugmentedAbiFunction {
  abi: IAbiFunction;
  derived: {
    inputTypes: string[];
    outputTypes: string[];
    inputNames: string[];
    outputNames: string[];
  };
  methodSelector: string;
  argHandlers: IFuncArgs;
}

export interface IAugmentedAbiEvent {
  abi: IAbiEvent;
  derived: {
    inputNamesIndexed: string[]
    inputTypesIndexed: string[]
    inputNames: string[]
    inputTypes: string[]
  }
  eventSelector: string | undefined,
  anonymous: boolean
}

export interface IAugmentedAbiConstructor {
  abi: IAbiConstructor
  derived: {
    inputTypes: string[],
    inputNames: string[]
  }
  argHandlers: IFuncArgs;
}

export interface IFuncArgs {
  [name: string]: {
    name: IAbiFunction['name'];
    type: IAbiFunction['type'];
    processInput(inputToParse: any): any;
  };
}

export interface IArgs {
  [name: string]: any;
}

export interface IDecode {
  [key: string]: any;
}

export interface IUserSuppliedArgs {
  [argumentName: string]: any;
}

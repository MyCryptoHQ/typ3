import { IEventFactory } from './../typings';
import * as abi from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import {
  makeArgHandlers,
  decodeArguments,
  decodeReturnValue,
  encodeArguments,
  encodeConstructor,
  decodeEvent
} from './components/coders';
import { IAbiFunction, IFuncOutputMappings, IFunctionFactory, IAugmentedAbiFunction, IAugmentedAbiConstructor, IConstructorFactory, IAbiConstructor, AbiMethodTypes, IAbiEvent, IAugmentedAbiEvent } from '../typings';

/* tslint:disable */
export const FunctionFactory = (
  abiFunc: IAbiFunction,
  outputMappings: IFuncOutputMappings = []
): IFunctionFactory => {
  const { inputs, name, outputs } = abiFunc;
  const argHandlers = makeArgHandlers(inputs);
  const inputTypes = inputs.map(({ type }) => type);
  const outputTypes = outputs.map(({ type }) => type);
  const inputNames = inputs.map(({ name }) => name);
  const outputNames: string[] = outputs.map(
    ({ name }, i) => name || outputMappings[i] || `${i}`
  );
  const methodSelector = abi.methodID(name, inputTypes).toString('hex');
  /* tslint:enable */
  const augmentedFunc: IAugmentedAbiFunction = {
    abi: abiFunc,
    argHandlers,
    derived: {
      inputNames,
      inputTypes,
      outputNames,
      outputTypes
    },
    methodSelector
  };

  return {
    type: AbiMethodTypes.function,
    constant: augmentedFunc.abi.constant,
    paramless: augmentedFunc.abi.inputs.length === 0,
    decodeArguments: args => decodeArguments(args, augmentedFunc),
    decodeReturnValue: ret => decodeReturnValue(ret, augmentedFunc),
    encodeArguments: args => encodeArguments(args, augmentedFunc)
  };
};

export const ConstructorFactory = (
  abiConstructor: IAbiConstructor
): IConstructorFactory => {
  const { inputs } = abiConstructor;
  const argHandlers = makeArgHandlers(inputs);
  const inputNames = inputs.map(({ name }) => name)
  const inputTypes = inputs.map(({ type }) => type)
  const augmentedConstructor: IAugmentedAbiConstructor = {
    abi: abiConstructor,
    argHandlers,
    derived: {
      inputNames,
      inputTypes
    }
  }
  return {
    type: AbiMethodTypes.constructor,
    paramless: augmentedConstructor.abi.inputs.length === 0,
    encodeArguments: (args, byteCode) => encodeConstructor(args, byteCode, augmentedConstructor)
  }
}

export const EventFactory = (
  abiEvent: IAbiEvent
): IEventFactory => {
  const { inputs, anonymous } = abiEvent
  const inputNamesIndexed: string[] = [];
  const inputTypesIndexed: string[] = [];
  const inputNames: string[] = [];
  const inputTypes: string[] = [];
  
  inputs.forEach((input) => {
    const {name, type, indexed } = input
    if(indexed){
      inputNamesIndexed.push(name);
      inputTypesIndexed.push(type)
    } else {
      inputNames.push(name)
      inputTypes.push(type)
    }
  })
  const eventSelector = getEventHash(abiEvent);
  const augmentedEvent: IAugmentedAbiEvent = {
    abi: abiEvent,
    derived: {
      inputNamesIndexed,
      inputTypesIndexed,
      inputNames,
      inputTypes
    },
    eventSelector,
    anonymous
  }
  return {
    type: AbiMethodTypes.event,
    decodeArguments: log => decodeEvent(log, augmentedEvent)
  }
}

const getEventHash = (eventAbi: IAbiEvent) => {
  const { name, inputs, anonymous } = eventAbi // tslint:disable-next-line
  const inputNames = inputs.map(({ name }) => name)
  if(anonymous){
    return undefined;
  } else {
    return ethUtil.keccak(`${name}${inputNames.join(',')}`).toString('hex')
  }
} 
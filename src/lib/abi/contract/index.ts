import { FunctionFactory } from '../function';
import { objReduce } from '../function/utils';
enum AbiMethodTypes {
  function = 'function',
  event = 'event',
  constructor = 'constructor'
}

interface IOutputMappings {
  [abiFuncName: string]: string[];
}
export const CreateContract = (
  abi: IAbiFunction[],
  outputMappings: IOutputMappings = {}
) => {
  const reducer = (c, currMethod) => {
    const { name, type } = currMethod;
    const handler = selector[type];
    return handler
      ? {
          ...c,
          [name]: handler(currMethod, outputMappings[name])
        }
      : c;
  };
  const contract = objReduce(abi, reducer);
  return contract;
};

const selector = {
  [AbiMethodTypes.function]: (
    abiFunc: IAbiFunction,
    outputMappings: IFuncOutputMappings
  ) => FunctionFactory(abiFunc, outputMappings)
};
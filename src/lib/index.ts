import { CreateContract } from './abi';
import { ProxiedNode, IProxiedNode } from './node';

interface IHandleCallParams {
  userArgs: any[] | null
  txObj: ICallTxObj;
  func: IFunctionFactory;
  node: IProxiedNode;
}

interface IHandleSendParams {
  userArgs: any[] | null
  txObj: ITransactionObj;
  func: IFunctionFactory;
  node: IProxiedNode;
}

const handleCall = async (args: IHandleCallParams) => {
  const { userArgs, func, node, txObj } = args;
  const data = func.encodeArguments(userArgs);
  const response = await node.eth_call({ data, ...txObj });
  const parsedResponse = func.decodeReturnValue(response);
  return parsedResponse;
};

const handleSend = async (args: IHandleSendParams) => {
  const { userArgs, func, node, txObj } = args;
  const data = func.encodeArguments(userArgs);
  const response = await node.eth_sendTransaction({ data, ...txObj });
  const parsedResponse = func.decodeReturnValue(response);
  return parsedResponse;
};

const ConnectedContract = <T>(
  contract: any,
  node: IProxiedNode,
  defaultTxObj: Partial<ITransactionObj> = {}
) => {
  const routeCalls = {
    get(target: any, propKey: any) {
      const contractMethod: IFunctionFactory = contract[propKey];
      const isConstant = contractMethod.constant;
      const isParamless = contractMethod.paramless;
      if (!contractMethod) {
        throw Error(`${propKey} is not a valid contract method`);
      }

      const returnFunc = (userArgs: any[], txObj: ICallTxObj | ITransactionObj) => {
        const mergedTxObj = isParamless
          ? { ...defaultTxObj, ...userArgs }
          : { ...defaultTxObj, ...txObj };
        const methodArgs: any = { //TODO fix issue between ICallTxObj and methodArgs
          func: contractMethod,
          node,
          txObj: mergedTxObj,
          userArgs: isParamless ? null : userArgs
        };
        return isConstant ? handleCall(methodArgs) : handleSend(methodArgs);
      };

      return returnFunc;
    }
  };
  return new Proxy(contract, routeCalls) as T;
};

export { ProxiedNode, CreateContract, ConnectedContract };

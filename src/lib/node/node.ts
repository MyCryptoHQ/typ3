import { IAugmentedNode, INode, IRPCRequestObj } from './typings';
import fetch from 'node-fetch';

export const NodeFactory = (endpoint: string): IAugmentedNode => {
  const node: INode = { endpoint };
  return {
    node,
    setEndpoint: (end: string) => setEndpoint(end, node),
    sendRpcRequest: (request: IRPCRequestObj) => sendRpcRequest(request, node)
  };
};

export const setEndpoint = (endpoint: string, node: INode) =>
  (node.endpoint = endpoint);

export const sendRpcRequest = async (request: IRPCRequestObj, node: INode) => {
  const { txObj, postprocessor, errorHandler } = request;
  const response = await fetch(node.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(txObj)
  }).then(r => r.json());
  const result = response.error
    ? errorHandler(response.error)
    : postprocessor(response);
  return result;
};

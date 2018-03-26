# Typ3 (Beta)

Typ3 provides a toolset that lets you instantiate fully-typed, promise-based contracts, nodes, and filters. Typ3 also exposes several typed RPC functions, and interfaces for working with JSON RPC calls.

## Getting Started
### Prerequisites

These packages are meant to be used in a Typescript, ES6 environment. Tests use testrpc to simulate blockchain deployments.

### Installing

```
npm install typ3

npm install @types/typ3

```

And we have our components!

```
import {ProxiedNode, CreateContract, ContractInstance, Filter} from 'typ3'

```

## Using the Libraries

### ProxiedNode
This is a factory function that will instantiate a node proxy object that represents a node as described by the [JSON RPC spec](https://github.com/ethereum/wiki/wiki/JSON-RPC). Calls that require information on block ranges will default to 'latest' unless otherwise specified.

#### Parameters:
Endpoint: The HTTP endpoint of the node.

```
import { ProxiedNode } from 'typ3'

const myNode = ProxiedNode('http://localhost:8545')

//bytecode = 0x6060604052341561000f57... rest of the deployed bytecode
const bytecode = await myNode.getCode('0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b')

```

### CreateContract
This is a factory function that will instantiate a raw contract proxy based on an abi. The raw contract proxy will map function and event names to function and event call objects. These objects have encoding and decoding methods that will return encoded/decoded blockchain data based on the abi specs. Raw contract proxies are passed as an argument to a ContractInstance factory. 

#### Parameters and Typings
\<T> : The interface for the raw contract. This is generated from the typ3-cli, and used to bind typings onto the proxy.

abi: The abi JSON object, parsed from an abi file.

```
import { IAbiInterface } from './abiTypes'
const myAbi = require('./abiFile.json');
const testContract = CreateContract<IAbiInterface>(testAbi)

//testContract['foo'] corresponds to abi definition for signature foo(uint32, bool)
//encoded = '0x7615fabb000000000000000000000000000000000000000000000000000000000000000450000000000000000000000000000000000000000000000000000000000000001
const encoded = testContract['foo'].encode(69, true);

//decoded = {0: 69, 1: true}
const decoded = testContract['foo'].decode(encoded)
```

### ContractInstance
Using a proxied node, and a raw contract, the ContractInstance will generate a ConnectedContract object, which lets you interact with a contract deployed on the blockchain by invoking functions on the ConnectedContract. You can create a ConnectedContract by passing an argument to the address of an already-deployed contract, or by passing the parameters and bytecode into the arguments to deploy a new contract. 

#### Parameters and Typings
\<T> : Interface
The interface for the Connected Contract. This is generated from the typ3-cli, and used to bind typings onto the proxy.

\<K> : Interface (optional)
In order to bind typings to the constructor call, you can specify a second, optional typing argument that is generated from the typ3-cli.

node: ProxiedNode
The proxiednode object we want to send RPC requests to.

contract: IContract
The raw contract object generated by CreateContract() factory.

args: ConstructorArguments
{
    params: {} | string
    If params is an address string, then the ContractInstance factory will check for bytecode deployed at that address, and link the ConnectedContract to that address if any is found.

    txObj: {} (optional)
    If you want to deploy a new contract on instantiation, then specify the sender address and bytecode in the txObj field, along with additional transaction object arguments.
}

So, for this contract..

```
pragma solidity ^0.4.0;
contract MyContract {
    bytes32 public text;
    function MyContract(bytes32 arg) public {
        text = arg;
    }
    function foo(int256 arg) pure returns (int256 output) {
        return arg + 1;
    }
    function bar(bytes32 arg) returns (bool finished) {
        text = arg;
        return true;
    }
}
```

You can invoke..

```
import { IMyContract, IMyContractConnected , IMyContractConstructor} from './abiTypes'
const myNode = ProxiedNode('http://localhost:8545')
const myAbi = require('./abiFile.json');
const myBytecode = require('./bytecode') //bytecode for the contract we want to deploy
const myContract = CreateContract<IAbiInterface>(testAbi)
const myInstance = ConnectedContract<IAbiInterfaceConnected, IAbiInterfaceConstructor>(myNode, myContract, {params: {arg: 'apple'}, txObj: {bytecode: myBytecode, from: '0x630b82ea92fb2fcbdacd10b5eb3a13905f82bec5'}})

//result0 = {0: 'apple'}
const result0 = await myInstance.text();

//result1 = {output: '1000001'}
const result1 = myInstance.foo('1000000')

//result2 = {finished: true};
const result2 = await myInstance.bar('grape')

//result3 = {0: 'grape'}
const result3 = await myInstance.text()
```

## Running the tests

Tests are run with testrpc listening on its default port (localhost:8545). 

```
npm run test
```

## Built With

* [ethereumjs libs](https://github.com/ethereumjs) - Ethereum utility libraries for js
* [node fetch](https://www.npmjs.com/package/node-fetch) - For composing HTTP requests

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
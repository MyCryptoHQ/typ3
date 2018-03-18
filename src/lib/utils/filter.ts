import { AbiMethodTypes } from './../abi/contract/index';
import { ProxiedNode, IProxiedNode } from '../node';
import delay from 'timeout-as-promise'

interface IFilter {
	stopWatching(): void,
	get(): Promise<IFilter>,
	watch(): void
}

export const Filter = async (
	node: IProxiedNode, 
	checkFor?: IFilterOptions,
	callback?: Function
) => {
	return callback ? new filter(node, checkFor).watch(callback) : new filter(node, checkFor)
}

class filter {
	checkFor?: IFilterOptions
	node: IProxiedNode;
	isWatching: boolean;
	filterId: string | null
	constructor(node: IProxiedNode, checkFor?: IFilterOptions) {
		this.checkFor = checkFor;
		this.node = node;
		this.isWatching === false;
	}

	stopWatching() {
		this.isWatching = false;
		if(this.filterId){
			this.node.eth_uninstallFilter(this.filterId)
		}
	}

	async get() {
		if(!this.filterId){
			const response = await this.node.eth_newFilter(this.checkFor ? this.checkFor : {})
			this.filterId = response
		}
		return this.node.eth_getFilterLogs(this.filterId);
	}

	async watch(callback: any) {
		this.isWatching = true;
		while(this.isWatching){
			const pollResponse = await pollFilter(this.node, this.filterId)
			if(pollResponse){
				callback(null, pollResponse)
			}
		}
	}
}

export const pollFilter = async (node: IProxiedNode, args?: any, parser?: Function, errorHandler?: Function) => { //TODO move this into a util file
	await delay(1000)
	const response = await node.eth_getFilterChanges(args, undefined, errorHandler)
	return response;
}
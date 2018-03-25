import { IFilterOptions, IFilterLog } from './../node/typings';
import { IProxiedNode } from '../node';
import { pollFilter } from './poll'

export interface IFilterObject {
	stopWatching(): void,
	get(): Promise<IFilterLog>,
	watch(): void
}

export const FilterFactory = async (
	node: IProxiedNode, 
	checkFor?: IFilterOptions,
	callback?: (err: any, result: any) => any
) => {
	return callback ? new Filter(node, checkFor).watch(callback) : new Filter(node, checkFor)
}

class Filter {
	public checkFor?: IFilterOptions
	public node: IProxiedNode;
	public isWatching: boolean;
	public filterId: string | null;
	constructor(node: IProxiedNode, checkFor?: IFilterOptions) {
		this.checkFor = checkFor;
		this.node = node;
		this.isWatching = false;
	}

	public stopWatching() {
		this.isWatching = false;
		if(this.filterId){
			this.node.eth_uninstallFilter(this.filterId)
		}
	}

	public async get() {
		if(!this.filterId){
			const response = await this.node.eth_newFilter(this.checkFor ? this.checkFor : {})
			this.filterId = response
		}
		return this.node.eth_getFilterLogs(this.filterId);
	}

	public async watch(callback: any) {
		this.isWatching = true;
		while(this.isWatching){
			const pollResponse = await pollFilter(this.node, this.filterId)
			if(pollResponse){
				callback(null, pollResponse)
			}
		}
	}
}
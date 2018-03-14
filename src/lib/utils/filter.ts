import { ProxiedNode, IProxiedNode } from '../node';

export const filter = {
	filter(checkFor: IFilterOptions, node: IProxiedNode, postprocessor?: any, callback?: any) {
		this.filterId = node.eth_newFilter(checkFor)
		this.filterOptions = checkFor
		this.node = node;
		this.postprocessor = postprocessor
		this.callback = callback
		this.isWatching === false;
	},

	stopWatching() {
		this.isWatching = false;
		this.node_uninstallFilter(this.filterId)
		this.filterId = null
	},

	async get() {
		const response = this.node.eth_getLogs(this.checkFor, this.postProcessor);
	},

	async watch(callback: any) {
		this.isWatching = true;
		while(this.isWatching === true){
			await setTimeout(async () => {
				const response = await this.node.eth_getFilterChanges(this.filterId, this.postProcessor, callback)
			}, 1000)
		}
	}
}
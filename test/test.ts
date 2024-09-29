import { VChainNode, VChainNodeNullable } from '../src/widgets/explorer/vchain';

let root = new VChainNode(1);
let index = root;
for(let i=2; i<11; i++) {
	let node: VChainNode = new VChainNode(i);
	index.insertNext(node);
	index = node;
}

root.testPrint();
root.insertNextN(root.next);
root.testPrint();
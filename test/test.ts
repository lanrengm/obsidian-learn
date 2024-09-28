import { VC, VCNullable } from 'src/widgets/explorer/x';


let root = new VC(1);
let index = root;
for(let i=2; i<11; i++) {
	let node: VC = new VC(i);
	index.insert(node);
	index = node;
}
root.remove();
root.remove();
root.remove();
root.testPrint();

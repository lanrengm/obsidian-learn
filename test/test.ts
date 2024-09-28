
export type VCNullable = VC | null;
export class VC {
  previous: VCNullable;
  next: VCNullable;
  testValue: number;

  constructor(v:number){
	this.testValue = v;
  }

  // 插入节点，插入到下一个位置
  insertNext(current: VC): void {
    let previous: VC = this;
    let next: VCNullable = this.next;
    previous.next = current;
    current.previous = previous;
    if (next) {
      current.next = next;
      next.previous = current;
    }
  }

  // 从链中删除节点，删除当前节点的下一个
  removeNext(): VCNullable {
    let previous: VC = this;
    let current: VCNullable = this.next;
    let next: VCNullable = current?.next ?? null;
    if (current) {
      current.previous = null;
      current.next = null;
    }
    previous.next = next;
    if (next) next.previous = previous;
    return current;
  }

  // 从链中删除指定数量的节点，删除当前节点的后续节点， 相当于删除子链，返回子链的头节点
  removeNextN(n: number): VCNullable {
    let head: VCNullable = this.next;
    let current: VCNullable = head;
    while (current && (n >= 1) ) {
      current = current.next;
      n = n - 1;
    }
    let previous: VC = this;
    let next: VCNullable = current?.next ?? null;
    previous.next = next;
    if (next) next.previous = previous;
    if (head) head.previous = null;
    if (current) current.next = null;
    return head;
  }

  testPrint() {
    let node: VCNullable = this;
    while(node) {
      console.log(node.testValue);
      node = node.next;
    }
  }
}

let root = new VC(1);
let index = root;
for(let i=2; i<11; i++) {
	let node: VC = new VC(i);
	index.insertNext(node);
	index = node;
}
root.removeNextN(3)?.testPrint();
root.testPrint();

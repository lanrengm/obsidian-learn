
import { VTreeNode } from './vtree';

export type VChainNodeNullable = VChainNode | null;
export class VChainNode {
  previous: VChainNodeNullable;
  next: VChainNodeNullable;
  vTreeNode: VTreeNode;

  constructor(vTreeNode: VTreeNode){
	  this.vTreeNode = vTreeNode;
  }

  // 插入节点，插入到下一个位置
  insertNext(current: VChainNode): void {
    let previous: VChainNode = this;
    let next: VChainNodeNullable = this.next;
    previous.next = current;
    current.previous = previous;
    if (next) {
      current.next = next;
      next.previous = current;
    }
  }

  // 插入子链，返回子链节点数量
  // 插入自身或自身的子链会造成死循环
  insertNextN(head: VChainNodeNullable): number {
    if (!head) return 0;
    let previous: VChainNode = this;
    let next: VChainNodeNullable = this.next;
    let last: VChainNode = head;
    let count: number = 1;
    while(last.next) {
      last = last.next;
      count++;
    }
    previous.next = head;
    head.previous = previous;
    last.next = next;
    if (next) next.previous = last;
    return count;
  }

  // 从链中删除节点，删除当前节点的下一个
  removeNext(): VChainNodeNullable {
    let previous: VChainNode = this;
    let current: VChainNodeNullable = this.next;
    let next: VChainNodeNullable = current?.next ?? null;
    if (current) {
      current.previous = null;
      current.next = null;
    }
    previous.next = next;
    if (next) next.previous = previous;
    return current;
  }

  // 从链中删除指定数量的节点，删除当前节点的后续节点， 相当于删除子链，返回子链的头节点
  removeNextN(n: number): VChainNodeNullable {
    if (n<1) return null;
    let head: VChainNodeNullable = this.next;
    let current: VChainNodeNullable = head;
    while (current && n > 1 ) {
      current = current.next;
      n = n - 1;
    }
    let previous: VChainNode = this;
    let next: VChainNodeNullable = current?.next ?? null;
    previous.next = next;
    if (next) next.previous = previous;
    if (head) head.previous = null;
    if (current) current.next = null;
    return head;
  }

  testPrint() {
    let node: VChainNodeNullable = this;
    while(node) {
      console.log(node.vTreeNode);
      node = node.next;
    }
  }
}

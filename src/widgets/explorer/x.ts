// VT - Tree 虚拟树
// VT - Node 虚拟树节点
// VC 虚拟链， previous，next
// FS 文件系统
// DOM 视图

import { TAbstractFile } from "obsidian";


class VN {
  vc: VC;
  fsT: TAbstractFile;
  dom: DOM;
}

export type VCNullable = VC | null;
export class VC {
  previous: VCNullable;
  next: VCNullable;
  testValue: number;

  constructor(v:number){
	this.testValue = v;
  }

  // 插入节点，插入到下一个位置
  insert(current: VC) {
    let previous: VC = this;
    let next: VCNullable = this.next;
    previous.next = current;
    current.previous = previous;
    if (next) {
      current.next = next;
      next.previous = current;
    }
  }

  // 删除节点，删除自己
  remove() {
    let previous: VCNullable = this.previous;
    let current: VC = this;
    let next: VCNullable = this.next;
    if (current) {
      current.next = null;
      current.previous = null;
      if (next) {
		previous.next = next;
        next.previous = previous;
      } else {
        previous.next = null;
      }
    }
  }

  testPrint() {
    let node: VCNullable = this;
    while(node) {
      console.log(node.testValue);
      node = node.next;
    }
  }
}

class DOM {
  item: HTMLElement;
  itemTitle: HTMLElement;
  itemTitleIcon: HTMLElement;
  itemTitleText: HTMLElement;
  itemTitleTag: HTMLElement;
  itemChildren: HTMLElement;
}
// VT - Tree 虚拟树
// VT - Node 虚拟树节点
// VC 虚拟链， previous，next
// FS 文件系统
// DOM 视图

import { TFolder, TFile } from "obsidian";

import { VChainNode, VChainNodeNullable } from './vchain';
import { ElNullable, DOM } from './dom';


export type TFNullable = TFolder | TFile | null;
export type VTreeNodeNullable = VTreeNode | null;
export class VTreeNode {
  vChainNode: VChainNode;
  tF: TFNullable;
  dom: DOM;
  children: VChainNode[];

  constructor(tF: TFNullable, dom: DOM) {
    this.vChainNode = new VChainNode(this);
    this.tF = tF;
    this.dom = dom;

    if (tF instanceof TFolder) {
      dom.createFolder(tF.path === '/' ? tF.path : tF.name);
    } else if (tF instanceof TFile) {
      dom.createFile(tF.name);
    }
  }
}

export type VTreeNullable = VTree | null;
export class VTree {
  root: VTreeNode;
  focused: VTreeNodeNullable = null;
  actived: VTreeNodeNullable = null;

  constructor(root: VTreeNode) {
    this.root = root;
    this.registerClickEvent(root);
  }

  mount(mountedPoint: HTMLElement): VTree {
    mountedPoint.empty();
    mountedPoint.appendChild(this.root.dom.item);
    return this;
  }

  unmount(): VTree {
    this.root.dom.item.remove();
    return this;
  }

  registerClickEvent(vn: VTreeNode) {
    vn.dom.itemTitle.onClickEvent(evt => {
      if (vn.dom.isFolder) {
        this.onClickFolder(vn);
      } else {
        this.onClickFile(vn);
      }
    });
  }
  onClickFolder(vn: VTreeNode) {
    this.focused?.dom.unfocus();
    vn.dom.focus();
    this.focused = vn;
  }

  onClickFile(vn: VTreeNode) {
    this.focused?.dom.unfocus();
    vn.dom.focus();
    this.focused = vn;
    this.actived?.dom.unactive();
    vn.dom.active();
    this.actived = vn;
  }

  upCourse() {
    if (!this.focused) {
      let currentVTreeNode = this.root;
      while (currentVTreeNode.vChainNode.next) {
        currentVTreeNode = currentVTreeNode.vChainNode.next.vTreeNode;
      }
      currentVTreeNode.dom.focus();
    } else {
      this.focused.dom.unfocus();
      this.focused = this.focused.vChainNode.next?.vTreeNode ?? null;
      this.focused?.dom.focus();
    }
  }
  donwCourse() {}
}

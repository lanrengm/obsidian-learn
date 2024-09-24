import { TFile, TFolder } from "obsidian";


function unlink(previous: ChainNode | null, next: ChainNode | null): void {
  // 为保证操作的安全性，必须断开两个已连接的节点
  if (
    // previous 和 next 分别有两种状态： ChainNode, null, 都不为 null 保证安全
    previous && next &&
    // previous.next 有三种状态： null, other, next， 为 next 则安全
    // next.previous 有三种状态： null, other, previous， 为 previous 则安全
    previous.next === next && next.previous === previous
  ) {
    previous.next = null;
    next.previous = null;
  }
  // previous 为空时，next.previous 也为空，则安全
  else if (!previous && next && !next.previous) {}
  // next 为空时，previous.next 也为空，则安全
  else if (previous && !next && !previous.next) {}
  // 以上选项都不匹配，意味着两个节点并不是已连接的，所以不能执行断开操作
  else throw new Error(`无法断开两个未连接的节点: previous: ${previous}, next: ${next}`);
}

function link(previous: ChainNode | null, next: ChainNode | null): void {
  // 链接节点之前先断开节点的旧链接以保证安全
  // previous 和 next 都为 ChainNode, 先断开两者的原始连接，再连接两者
  if (previous && next) {
    unlink(previous, previous.next);
    unlink(next.previous, next);
    previous.next = next;
    next.previous = previous;
  }
  // previous 为 null, 只需要断开 next 的原始连接即可
  else if (!previous && next) unlink(next.previous, next);
  // next 为 null，只需要断开 previous 的原始连接即可
  else if (previous && !next) unlink(previous, previous.next);
  // 都为 null 时什么都不需要做
  else {}
}

class ChainNode {
  previous: ChainNode | null = null;
  next: ChainNode | null = null;
}

class Chain {
  first: ChainNode | null = null;
  last: ChainNode | null = null;
  focused: ChainNode | null = null;

  insertChain(first: ChainNode | null, last: ChainNode | null) {
    if (!this.focused) throw new Error(`先选中节点，再插入子链表`);
    // 子链表不为空时，first 和 last 都不为空，可以执行连接
    else if (first && last) {
      let previous = this.focused;
      let next = this.focused.next;
      // 头部进行一次连接
      link(previous, first);
      // 尾部进行一次连接
      link(last, next);
    }
    // 子链表为空时，first 和 last 都为 null，什么都不用做
    else if (!first && !last) {}
    // 出现一个为 null 时表示异常现象。
    else throw new Error(`插入子链表时出错: first last 不能为 null, first:${first}, last: ${last}`);
  }
  removeChain(last: ChainNode | null) {
    if (!this.focused) throw new Error(`先选中节点，再删除子链表`);
    else if (last) {
      let previous = this.focused;
      let next = last.next;
      link(previous, next);
    }
    // last 为空时报错
    else throw new Error(`删除子链表时出错: last 不能为 null, last:${last}`)
  }
  insertNode(node: ChainNode | null) {
    
    if (node) {
      let previous = this.focused;
      let next = this.next;
      link(previous, node);
      link(node, next);
    } else throw new Error(`链表禁止插入 null, node:${node}`);
  }
  removeNode() {
    let previous = this.previous;
    let next = this.next;
    link(previous, next);
  }
}

class TreeNode extends ChainNode {
  children: TreeNode[];

  // 销毁一个子树
  destroy() {
    this.vNode.destroy();
    this.previous = null;
    while (this.children.length > 0) {
      this.children.pop()?.destroy();
    }
    this.next = null;
  }
}

class ShadowNode extends TreeNode {
  tF: TFolder | TFile;
  vNode: VisualFolder | VisualFile;

}

class ShadowTree {
  root: ShadowNode | null = null;
  focused: ShadowNode | null = null;
  actived: ShadowNode | null = null;

  mountSubChain() {}
  unmountSubChain() {}
}

import { TFile, TFolder } from "obsidian";


function unlink(previous: ChainNode<T> | null, next: ChainNode<T> | null): void {
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

function link(previous: ChainNode<T> | null, next: ChainNode<T> | null): void {
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

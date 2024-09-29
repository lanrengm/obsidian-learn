// DOM 视图
// VC 虚拟链， previous，next
// VT - Node 虚拟树节点 (FS 文件系统)

// VT - Tree 虚拟树

import { TAbstractFile, TFolder, TFile } from "obsidian";

export class DOM {
  item: HTMLElement;
  itemTitle: HTMLElement;
  itemTitleIcon: HTMLElement | null = null;
  itemTitleText: HTMLElement | null = null;
  itemTitleTag: HTMLElement | null = null;
  itemChildren: HTMLElement | null = null;
  isFolder: boolean = false;
  paddingLeft: string = '24px';
  depth: number = 0;

  initDOM(paddingLeft: string, depth: number): this {
    this.paddingLeft = paddingLeft;
    this.depth = depth;
    // init
    this.item = createDiv({cls: 'tree-item'});
    this.itemTitle = this.item.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${paddingLeft} + ${depth * 17}px) !important;`
      }
    });
    return this;
  }

  createFolder(name: string): this {
    this.item.addClasses(['nav-folder', 'is-collapsed']);
    this.itemTitle.addClasses(['nav-folder-title', 'mod-collapsible']);
    this.itemTitleIcon = this.itemTitle.createDiv({ 
      cls: ['tree-item-icon', 'nav-folder-collapse-indicator', 'collapse-icon', 'is-collapsed']
    });
    // 模仿文件管理器部分的 【展开/收起】 图标
    // '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>'
    let svgIcon = this.itemTitleIcon.createSvg('svg', { attr: {
      'xmlns': 'http://www.w3.org/2000/svg',
      'width': '24',
      'height': '24',
      'viewBox': '0 0 24 24',
      'fill': 'none',
      'stroke': 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'class': 'svg-icon right-triangle'
    }});
    svgIcon.createSvg('path', { attr: {'d': 'M3 8L12 17L21 8'}});
    this.itemTitleText = this.itemTitle.createDiv({
      cls: ['tree-item-inner', 'nav-folder-title-content']
    });
    this.itemChildren = this.item.createDiv({
      cls: ['tree-item-children', 'nav-folder-children']
    });
    // set value
    this.itemTitleText?.setText(name);
    this.isFolder = true;
    return this;
  }

  createFile(name: string): this {
    // render
    this.item.addClass('nav-file');
    this.itemTitle.addClasses(['nav-file-title', 'tappable']);
    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let res: string[] | null = re.exec(name);
    let tName: string;
    let tExt: string;
    if (res) {
      tName = res[1];
      tExt = res[2] === 'md'? '' : res[2];
    } else {
      tName = name;
      tExt = 'nul';
    }
    // inner
    this.itemTitleText = this.itemTitle.createDiv({
      text: tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
    // tag
    this.itemTitleTag = this.itemTitle.createDiv({
      text: tExt,
      cls: 'nav-file-tag'
    });
    // set value
    this.isFolder = false;
    return this;
  }

  transToFile(name: string) {
    this.item.removeClasses(['nav-folder', 'is-collapsed']);
    this.itemTitle.removeClasses(['nav-folder-title', 'mod-collapsible']);
    this.itemTitle.empty();
    this.itemTitleIcon = null;
    this.itemTitleText = null;
    this.itemChildren?.remove();
    this.itemChildren = null;
    this.createFile(name);
    this.isFolder = false;
  }

  transToFolder(name: string) {
    this.item.removeClass('nav-file');
    this.itemTitle.removeClasses(['nav-file-title', 'tappable']);
    this.itemTitle.empty();
    this.itemTitleText = null;
    this.itemTitleTag = null;
    this.createFolder(name);
    this.isFolder = true;
  }

  focus() {
    this.itemTitle.addClass('has-focus')
  }
  unfocus() {
    this.itemTitle.removeClass('has-focus');
  }
  active() {
    this.itemTitle.addClass('is-active')
  }
  unactive() {
    this.itemTitle.removeClass('is-active');
  }

}

export class VChainNode extends DOM {
  previous: this | null;
  next: this | null;

  initChainNode(): this {
    return this;
  }

  // 插入节点，插入到下一个位置, 返回下一个节点
  insertNext(current: this): this {
    let previous: this = this;
    let next: this | null = this.next;
    previous.next = current;
    current.previous = previous;
    if (next) {
      current.next = next;
      next.previous = current;
    }
    return current;
  }

  // 插入子链，返回子链节点数量
  // 插入自身或自身的子链会造成死循环
  insertNextN(head: this | null): number {
    if (!head) return 0;
    let previous: this = this;
    let next: this | null = this.next;
    let last: this = head;
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
  removeNext(): this | null {
    let previous: this = this;
    let current: this | null = this.next;
    let next: this | null = current?.next ?? null;
    if (current) {
      current.previous = null;
      current.next = null;
    }
    previous.next = next;
    if (next) next.previous = previous;
    return current;
  }

  // 从链中删除指定数量的节点，删除当前节点的后续节点， 相当于删除子链，返回子链的头节点
  removeNextN(n: number): this | null {
    if (n<1) return null;
    let head: this | null = this.next;
    let current: this | null = head;
    while (current && n > 1 ) {
      current = current.next;
      n = n - 1;
    }
    let previous: this = this;
    let next: this | null = current?.next ?? null;
    previous.next = next;
    if (next) next.previous = previous;
    if (head) head.previous = null;
    if (current) current.next = null;
    return head;
  }

  testPrint() {
    let node: this | null = this;
    while(node) {
      console.log(node);
      node = node.next;
    }
  }
}

export type TFNullable = TAbstractFile | TFolder | TFile | null;
export class VTreeNode extends VChainNode {
  tF: TFNullable;
  tFSortedChildren: TAbstractFile[] = [];
  children: this[] = [];
  isExpanded: boolean = false;

  initTreeNode(tF: TFNullable): this {
    this.tF = tF;
    this.tFSortedChildren = this.getSortedTFChildren();

    if (tF instanceof TFolder) {
      this.createFolder(tF.path === '/' ? tF.path : tF.name);
    } else if (tF instanceof TFile) {
      this.createFile(tF.name);
    }

    return this;
  }

  expandChildren(vTree: VTree) {
    if (this.tF instanceof TFolder && !this.isExpanded) {
      let current = this;
      this.tFSortedChildren.forEach(e => {
        let n = new VTreeNode().initDOM(this.paddingLeft, this.depth + 1).initChainNode().initTreeNode(e) as this;
        this.itemChildren?.appendChild(n.item); // DOM
        vTree.registerClickEvent(n); // ClickEvent
        current = current.insertNext(n); // VChain
        this.children.push(n); // VTreeNode
      });
      this.isExpanded = true;
      this.item.removeClass('is-collapsed');
      this.itemTitleIcon?.removeClass('is-collapsed');
    }
  }

  collapseChildren() {
    if (this.tF instanceof TFolder && this.isExpanded) {
      // 处理子链
      this.children.forEach(e => {
        if (e.isExpanded) e.collapseChildren();
      });
      this.itemChildren?.empty(); // DOM
      this.removeNextN(this.children.length); // VChain
      this.children = []; // VTreeNode
      this.isExpanded = false;
      this.item.addClass('is-collapsed');
      this.itemTitleIcon?.addClass('is-collapsed');
    }
  }

  getSortedTFChildren(): TAbstractFile[] {
    if (this.tF instanceof TFolder) {
      let folderArr: TFolder[] = [];
      let fileArr: TFile[] = [];
      this.tF.children.forEach(e => {
        e instanceof TFolder ? folderArr.push(e) : fileArr.push(e as TFile);
      })
      return [...folderArr, ...fileArr] as TAbstractFile[];
    } else {
      return [];
    }
  }
}

export class VTree {
  root: VTreeNode;
  focused: VTreeNode | null = null;
  actived: VTreeNode | null = null;
  mountedPoint: HTMLElement | null = null;

  constructor(root: VTreeNode) {
    this.root = root;
    this.registerClickEvent(root);
  }

  mount(mountedPoint: HTMLElement): this {
    mountedPoint.empty();
    mountedPoint.appendChild(this.root.item);
    return this;
  }

  mountNulRoot(mountedPoint: HTMLElement): this {
    mountedPoint.empty();
    // create children
    this.root.expandChildren(this);
    if (this.root.children.length > 0) {
      this.root.children.forEach(e => {
        mountedPoint.appendChild(e.item);
      });
      this.root = this.root.next!;
      this.root.previous = null;
    }
    return this;
  }

  unmount(): this {
    this.mountedPoint?.empty();
    return this;
  }

  registerClickEvent(node: VTreeNode) {
    node.itemTitle.onClickEvent(evt => {
      if (node.isFolder) {
        this.onClickFolder(node);
      } else {
        this.onClickFile(node);
      }
    });
  }

  onClickFolder(node: VTreeNode) {
    this.focused?.unfocus();
    // node
    node.focus();
    if (!node.isExpanded) {
      node.expandChildren(this);
    } else {
      node.collapseChildren();
    }
    console.log('hi');

    this.focused = node;
  }

  onClickFile(node: VTreeNode) {
    this.focused?.unfocus();
    node.focus();
    this.focused = node;
    this.actived?.unactive();
    node.active();
    this.actived = node;
  }

  upCourse() {
    if (!this.focused) {
      let currentNode = this.root;
      while (currentNode.next) {
        currentNode = currentNode.next;
      }
      this.focused = currentNode;
      currentNode.focus();
    } else {
      this.focused.unfocus();
      this.focused = this.focused.previous;
      this.focused?.focus();
    }
  }
  donwCourse() {
    if (!this.focused) {
      this.focused = this.root;
      this.focused.focus();
    } else {
      this.focused.unfocus();
      this.focused = this.focused.next;
      this.focused?.focus();
    }
  }
  
}

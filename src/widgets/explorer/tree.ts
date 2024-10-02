// DOM 视图
// VC 虚拟链， previous，next
// VT - Node 虚拟树节点 (FS 文件系统)

// VT - Tree 虚拟树

import { TAbstractFile, TFolder, TFile, WorkspaceLeaf, Menu, Notice } from "obsidian";
import { ZoneView } from "./view";


export type TFNullable = TAbstractFile | TFolder | TFile | null;
export class VTreeNode {
  tF: TFNullable;
  tFSortedChildren: TAbstractFile[] = [];
  children: this[] = [];
  isExpanded: boolean = false;

  // dom
  vTree: VTree;
  item: HTMLElement;
  itemTitle: HTMLElement;
  itemTitleIcon: HTMLElement | null = null;
  itemTitleText: HTMLElement | null = null;
  itemTitleTag: HTMLElement | null = null;
  itemChildren: HTMLElement | null = null;
  isFolder: boolean = false;
  depth: number = 0;

  // chain
  previous: this | null;
  next: this | null;

  constructor(props: {vTree: VTree, depth: number, tF: TFNullable}) {
    const { vTree, depth, tF } = props;
    this.vTree = vTree;
    this.depth = depth;
    this.tF = tF;
    this.tFSortedChildren = this._getTFSortedChildren();
    // init dom
    this.item = createDiv({cls: 'tree-item'});
    this.itemTitle = this.item.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${this.vTree.view.paddingLeft} + ${depth * 17}px) !important;`
      }
    });
    this.itemTitle.addEventListener('click', this.onClick);
    this.itemTitle.addEventListener('auxclick', this.onAuxClick);
    if (tF instanceof TFolder) {
      this.renderFolder(tF.path === '/' ? tF.path : tF.name);
    } else if (tF instanceof TFile) {
      this.renderFile(tF.name);
    }
  }

  private _getTFSortedChildren(): TAbstractFile[] {
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

  folderExpand() {
    if (this.tF instanceof TFolder && !this.isExpanded) {
      let current = this;
      this.tFSortedChildren.forEach(tF => {
        let n = new VTreeNode({
          vTree: this.vTree,
          depth: this.depth + 1,
          tF: tF,
        }) as this;
        this.itemChildren?.appendChild(n.item); // DOM
        current = current.insertNext(n); // VChain
        this.children.push(n); // VTreeNode
      });
      this.isExpanded = true;
      this.item.removeClass('is-collapsed');
      this.itemTitleIcon?.removeClass('is-collapsed');
    }
  }

  folderCollapse() {
    if (this.tF instanceof TFolder && this.isExpanded) {
      // 处理子链
      this.children.forEach(e => {
        if (e.isExpanded) e.folderCollapse();
      });
      this.itemChildren?.empty(); // DOM
      this.removeNextN(this.children.length); // VChain
      this.children = []; // VTreeNode
      this.isExpanded = false;
      this.item.addClass('is-collapsed');
      this.itemTitleIcon?.addClass('is-collapsed');
    }
  }

  openFile() {
    let leaf: WorkspaceLeaf = this.vTree.view.app.workspace.getLeaf(false);
    if (this.tF instanceof TFile) {
      leaf.openFile(this.tF, { eState: { focus: true } });
    }
  }

  onClick = (evt: MouseEvent) => {
    // click folder
    if (this.isFolder) {
      // node
      this.focus();
      if (!this.isExpanded) {
        this.folderExpand();
      } else {
        this.folderCollapse();
      }
    }
    //  click file
    else {
      this.vTree.focused?.unfocus();
      this.focus();
      this.vTree.actived?.unactive();
      this.active();
      this.openFile();
    }
  }

  onAuxClick = (evt: MouseEvent) => {
    this.focus();
    let m = new Menu();
    if (this.isFolder) {
      m.addItem(menuItem => menuItem.setTitle('focus on this folder').setIcon('eye').onClick(() => {
        this.vTree.view.focusedTree = new VTree({view: this.vTree.view, rootPath: this.tF!.path});
        this.vTree.view.usedTree = this.vTree.view.focusedTree;
        this.vTree.view.usedTree.mount();
      }));
    }
    m.addItem(menuItem => menuItem
      .setTitle('Hi')
      .setIcon('folder')
      .onClick(() => new Notice('hi')));
    m.showAtMouseEvent(evt);
  }

  /* dom */
  
  renderFolder(name: string): this {
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

  renderFile(name: string): this {
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
    this.renderFile(name);
    this.isFolder = false;
  }

  transToFolder(name: string) {
    this.item.removeClass('nav-file');
    this.itemTitle.removeClasses(['nav-file-title', 'tappable']);
    this.itemTitle.empty();
    this.itemTitleText = null;
    this.itemTitleTag = null;
    this.renderFolder(name);
    this.isFolder = true;
  }

  focus() {
    this.vTree.focused?.unfocus();
    this.itemTitle.addClass('has-focus');
    this.vTree.focused = this;
  }

  unfocus(): this {
    this.itemTitle.removeClass('has-focus');
    return this;
  }

  active() {
    this.vTree.actived?.unactive();
    this.itemTitle.addClass('is-active');
    this.vTree.actived = this;
  }

  unactive(): this {
    this.itemTitle.removeClass('is-active');
    return this;
  }

  /* chain */
  
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

export class VTree {
  view: ZoneView;
  root: VTreeNode;
  focused: VTreeNode | null = null;
  actived: VTreeNode | null = null;

  constructor(props: { view: ZoneView, rootPath: string }) {
    const { view, rootPath } = props;
    this.view = view;
    this.root = new VTreeNode({
      vTree: this,
      depth: 0,
      tF: this.view.app.vault.getFolderByPath(rootPath),
    });
  }
  
  mount(): this {
    this.view.mountedPoint?.empty();
    if (this.view.widget.settings.enableRoot) {
      // 挂载根
      this.view.mountedPoint?.appendChild(this.root.item);
    } else {
      // 不挂载根
      // create children
      this.root.depth = -1;
      this.root.folderExpand();
      if (this.root.next) {
        this.root.children.forEach(vTreeNode => {
          this.view.mountedPoint?.appendChild(vTreeNode.item);
        });
        this.root = this.root.next;
        this.root.previous = null;
      } else {
        // 根为空文件夹
        this.view.mountedPoint?.appendChild(this.root.item);
      }
    }
    return this;
  }
  
  unmount(): this {
    this.view.mountedPoint?.empty();
    return this;
  }

  cursorUp() {
    if (!this.focused) {
      if (this.actived?.previous) {
        this.focused = this.actived.previous;
      } else {
        let currentNode = this.root;
        while (currentNode.next) {
          currentNode = currentNode.next;
        }
        this.focused = currentNode;
      }
      this.focused.focus();
    } else if (this.focused.previous) {
      this.focused.unfocus();
      this.focused = this.focused.previous;
      this.focused?.focus();
    }
  }

  cursorDown() {
    if (!this.focused) {
      this.focused = this.actived?.next ?? this.root;
      this.focused.focus();
    } else if (this.focused.next) {
      this.focused.unfocus();
      this.focused = this.focused.next;
      this.focused?.focus();
    }
  }
}

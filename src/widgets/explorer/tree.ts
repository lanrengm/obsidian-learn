import { TFolder, TFile } from 'obsidian';
import { ZoneView } from './view';

export class ZoneNode {
  static paddingLeft: string = '24px';
  // tree
  tree: ZoneTree;
  parent: ZoneNode | null = null;
  children: ZoneNode[];
  depth: number; // 样式渲染需要知道节点的深度
  // chain
  previous: ZoneNode | null = null;
  next: ZoneNode | null = null;
  // value
  t: TFolder | TFile;
  // dom
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  // 文件夹节点专有元素
  treeItemIcon: HTMLElement | null = null;
  treeItemChildren: HTMLElement | null = null;
  // 文件节点专有元素
  tName: string;
  tExt: string;

  static downExplorerCursor() {
    ZoneNode.currentNode = ZoneNode.currentNode?.after ?? ZoneNode.firstNode;
    ZoneNode.focusCurrentNode();
  }

  static upExplorerCursor() {
    ZoneNode.currentNode = ZoneNode.currentNode?.before ?? ZoneNode.lastNode;
    ZoneNode.focusCurrentNode();
  }

  static focusCurrentNode() {
    ZoneNode.focusedNode?.treeItemSelf.removeClass('has-focus');
    ZoneNode.focusedNode = ZoneNode.currentNode;
    ZoneNode.focusedNode?.treeItemSelf.addClass('has-focus');
  }

  static expandCurrentFolder() {
    if (ZoneNode.currentNode?.t instanceof TFolder &&
        !ZoneNode.currentNode.treeItemChildren
    ) {
      ZoneNode.currentNode.treeItem.removeClass('is-collapsed');
      ZoneNode.currentNode.treeItemIcon?.removeClass('is-collapsed');
      ZoneNode.currentNode.treeItemChildren = ZoneNode.currentNode.treeItem.createDiv({
        cls: ['tree-item-children', 'nav-folder-children']
      });
      ZoneNode.renderTree(
        ZoneNode.currentNode.t.path, 
        ZoneNode.currentNode.treeItemChildren,
        ZoneNode.currentNode.depth + 1,
      );
    }
  }

  static collapseExplorerFolder() {
    if (ZoneNode.currentNode?.t instanceof TFolder &&
        ZoneNode.currentNode.treeItemChildren
    ) {
      ZoneNode.currentNode.treeItem.addClass('is-collapsed');
      ZoneNode.currentNode.treeItemIcon?.addClass('is-collapsed');
      ZoneNode.currentNode.treeItemChildren.remove();
      ZoneNode.currentNode.treeItemChildren = null;
      let nextNode: ZoneNode | null = ZoneNode.currentNode.after;
      while(nextNode !== null && ZoneNode.currentNode.depth < nextNode?.depth) {
        nextNode = nextNode.next;
      }
      ZoneNode.currentNode.after = nextNode;
      if (nextNode) {
        nextNode.previous = ZoneNode.currentNode.after;
      }
    }
  }

  constructor(tree: ZoneTree, path: string) {
    this.tree = tree;
    this.t = this.tree.view.app.vault.getAbstractFileByPath(path);
    this.sortChildrenT();
  }

  createChildrenNode(mountedEl: HTMLElement, depth: number) {
    this.children.forEach(node => node.createNode(mountedEl, depth+1));
  }

  createNode(mountedEl: HTMLElement, depth: number) {
    this.renderInit(depth);
    if (this.t instanceof TFolder) {
      this.renderFolderEl();
    } else if (this.t instanceof TFile) {
      this.renderFileEl();
    } else {
      console.log('not folder and file');
      console.log(this.t)
    }
    mountedEl.appendChild(this.treeItem);
  }

  private renderInit(depth: number) {
    this.treeItem = createDiv({cls: 'tree-item'});
    this.treeItemSelf = this.treeItem.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${ZoneNode.paddingLeft} + ${depth * 17}px) !important;`
      }
    });
  }

  private renderFolderEl() {
    this.treeItem.addClasses(['nav-folder', 'is-collapsed']);
    this.treeItemSelf.addClasses(['nav-folder-title', 'mod-collapsible']);
    // create icon
    this.treeItemIcon = this.treeItemSelf.createDiv({ 
      cls: ['tree-item-icon', 'nav-folder-collapse-indicator', 'collapse-icon', 'is-collapsed']
    });
    // 模仿文件管理器部分的 【展开/收起】 图标
    // '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>'
    let svgIcon = this.treeItemIcon.createSvg('svg', { attr: {
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
    svgIcon.createSvg('path', { attr: {
      'd': 'M3 8L12 17L21 8'
    }});
    // inner
    this.treeItemSelf.createDiv({
      cls: ['tree-item-inner', 'nav-folder-title-content'],
      text: this.t.path === '/' ? this.t.path : this.t.name,
    });
  }

  private renderFileEl() {
    this.treeItem.addClass('nav-file');
    this.treeItemSelf.addClasses(['nav-file-title', 'tappable']);
    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let res: string[] | null = re.exec(this.t.name);
    if (res) {
      this.tName = res[1];
      this.tExt = res[2] === 'md'? '' : res[2];
    } else {
      this.tName = this.t.name;
      this.tExt = 'nul';
    }
    // inner
    this.treeItemSelf.createDiv({
      text: this.tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
    // tag
    this.treeItemSelf.createDiv({
      text: this.tExt,
      cls: 'nav-file-tag'
    });
  }

}

export class ZoneTree {
  // 视图
  view: ZoneView;
  // tree
  root: ZoneNode | null = null;
  // chain
  firstNode: ZoneNode | null = null;
  lastNode: ZoneNode | null = null;
  // value
  focusedNode: ZoneNode | null = null;
  activedNode: ZoneNode | null = null;

  renderLevel(path: string, mountedEl: HTMLElement, depth: number) {
    let root = this.view.app.vault.getFolderByPath(path);
    
    if (!ZoneNode.firstNode) {
      ZoneNode.firstNode = zoneNodeList.first() ?? null;
    }
    if (!ZoneNode.lastNode) {
      ZoneNode.lastNode = zoneNodeList.last() ?? null;
    }
    // 处理节点链表
    let previousNode: ZoneNode | null = ZoneNode.currentNode;
    let lastNode: ZoneNode | null = previousNode?.next ?? null;
    zoneNodeList.forEach((presentNode, index) => {
      if (previousNode) {
        previousNode.next = presentNode;
        presentNode.previous = previousNode;
      }
      previousNode = presentNode;
      // 挂载到DOM
      mountedEl.appendChild(presentNode.treeItem);
    });
    if (previousNode && lastNode) {
      previousNode.next = lastNode;
      lastNode.previous = previousNode;
    }
  }

  sortChildrenT() {
    // 分离 folder 和 file
    let folderList: Array<TFolder> = [];
    let fileList: Array<TFile> = [];
    this.t.children.forEach((t) => t instanceof TFolder ? folderList.push(t) : fileList.push(t as TFile));
    folderList.sort();
    fileList.sort();
    let zoneNodeList: Array<ZoneNode> = [
      ...folderList.map(t => new ZoneNode(t, depth)),
      ...fileList.map(t => new ZoneNode(t, depth))
    ];
  }

  // 是否显示根节点
  enableShowRoot: boolean = false;

  // 拿到根节点，创建一个树
  constructor(view: ZoneView) {
    this.view = view;
  }

  setRoot(path: string): ZoneTree {
    this.root = new ZoneNode(this, path);
    return this;
  }

  // 渲染可视元素
  createTree(mountedEl: HTMLElement) {
    if (this.enableShowRoot) {
      this.root?.createNode(mountedEl, 0);
    } else {
      this.root?.createChildrenNode(mountedEl, -1);
    }
  }
}
import { TFolder, TFile } from 'obsidian';
import { ZoneView } from './view';

export class ZoneNode {
  // 视图
  static view: ZoneView;
  // 扁平化的树
  // private static _list: ZoneNode[];
  // private static _index: number | null = null;

  // 根节点
  // private static _root: ZoneNode | null = null;
  static firstNode: ZoneNode | null = null;
  static lastNode: ZoneNode | null = null;
  static currentNode: ZoneNode | null = null;
  static focusedNode: ZoneNode | null = null;
  static activedNode: ZoneNode | null = null;

  // 节点值
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  t: TFolder | TFile;
  depth: number; // 样式渲染需要知道节点的深度
  // 子节点
  children: ZoneNode[];
  before: ZoneNode | null = null;
  after: ZoneNode | null = null;
  // 文件夹节点专有元素
  treeItemIcon: HTMLElement | null = null;
  treeItemChildren: HTMLElement | null = null;
  // 文件节点专有元素
  tName: string;
  tExt: string;

  static renderTree(path: string, el: HTMLElement, depth: number) {
    let root = this.view.app.vault.getFolderByPath(path);
    
    // 分离 folder 和 file
    let folderList: Array<TFolder> = [];
    let fileList: Array<TFile> = [];
    root?.children.forEach((t) => t instanceof TFolder ? folderList.push(t) : fileList.push(t as TFile));
    folderList.sort();
    fileList.sort();
    let zoneNodeList: Array<ZoneNode> = [
      ...folderList.map(t => new ZoneNode(t, depth)),
      ...fileList.map(t => new ZoneNode(t, depth))
    ];
    if (!ZoneNode.firstNode) {
      ZoneNode.firstNode = zoneNodeList.first() ?? null;
    }
    if (!ZoneNode.lastNode) {
      ZoneNode.lastNode = zoneNodeList.last() ?? null;
    }
    // 处理节点链表
    let previousNode: ZoneNode | null = ZoneNode.currentNode;
    let lastNode: ZoneNode | null = previousNode?.after ?? null;
    zoneNodeList.forEach((presentNode, index) => {
      if (previousNode) {
        previousNode.after = presentNode;
        presentNode.before = previousNode;
      }
      previousNode = presentNode;
      // 挂载到DOM
      el.appendChild(presentNode.treeItem);
    });
    if (previousNode && lastNode) {
      previousNode.after = lastNode;
      lastNode.before = previousNode;
    }
  }

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
        nextNode = nextNode.after;
      }
      ZoneNode.currentNode.after = nextNode;
      if (nextNode) {
        nextNode.before = ZoneNode.currentNode.after;
      }
    }
  }

  constructor(t: TFolder | TFile, depth: number) {
    this.t = t;
    this.depth = depth;

    this.treeItem = createDiv({cls: 'tree-item'});
    this.treeItemSelf = this.treeItem.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${this.depth * 17}px !important; padding-inline-start: calc( ${ZoneNode.view.paddingLeft} + ${this.depth * 17}px) !important;`
      }
    });
    this.renderNode();
  }

  renderNode() {
    if (this.t instanceof TFolder) {
      this.renderFolderNode();
    } else if (this.t instanceof TFile) {
      this.renderFileNode();
    } else {
      console.log('not folder and file');
      console.log(this.t)
    }
  }

  renderFolderNode() {
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
    // create text
    this.treeItemSelf.createDiv({
      cls: ['tree-item-inner', 'nav-folder-title-content'],
      text: this.t.path === '/' ? this.t.path : this.t.name,
    });
  }

  renderFileNode() {
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

    // create text
    this.treeItemSelf.createDiv({
      text: this.tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });

    // create tag
    this.treeItemSelf.createDiv({
      text: this.tExt,
      cls: 'nav-file-tag'
    });
  }

  openFile() {}

  openFolder() {}

}

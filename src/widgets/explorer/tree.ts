import { TFolder, TFile } from 'obsidian';
import { ZoneView } from './view';

export class ZoneNode {
  // 视图
  static view: ZoneView;
  // 扁平化的树
  private static _list: ZoneNode[];
  private static _index: number | null = null;
  // 根节点
  private static _root: ZoneNode | null = null;

  // 节点值
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  t: TFolder | TFile;
  depth: number; // 样式渲染需要知道节点的深度
  // 子节点
  children: ZoneNode[];
  // 文件夹节点专有元素
  treeItemIcon: HTMLElement | null = null;
  treeItemChildren: HTMLElement | null = null;
  // 文件节点专有元素
  tName: string;
  tExt: string;

  static renderTree(rootPath: string, el: HTMLElement) {
    let root = this.view.app.vault.getFolderByPath(rootPath);

    // 分离 folder 和 file
    let folderList: Array<TFolder> = [];
    let fileList: Array<TFile> = [];
    root?.children.forEach((t) => t instanceof TFolder ? folderList.push(t) : fileList.push(t as TFile));
    folderList.sort();
    fileList.sort();

    let tempNode: ZoneNode;
    // 渲染文件夹部分 nav-folder
    folderList.forEach(t => {
      let n = new ZoneNode(t, 0);
      el.appendChild(n.treeItem);
    });
    // 渲染文件部分 nav-file
    fileList.forEach(t => {
      let n = new ZoneNode(t, 0);
      el.appendChild(n.treeItem);
    });
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
      console.log('folder');
      console.log(this.t);
    } else if (this.t instanceof TFile) {
      this.renderFileNode();
      console.log('file');
      console.log(this.t);
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

  // 前序遍历 N 叉树
  preOrderTraversal(result: ZoneNode[]): void {
    result.push(this);
    this.children.forEach(e => e.preOrderTraversal(result));
  }

  upExplorerCursor() {}

  downExplorerCursor() {}

  expandExplorerFolder() {}

  collapseExplorerFolder() {}

  openFile() {}

  openFolder() {}

  // 设置为根节点
  setToRoot() {
    ZoneNode._root = this;
  }

}

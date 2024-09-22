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
  // 文件夹节点专有元素
  treeItemIcon: HTMLElement | null = null;
  treeItemChildren: HTMLElement | null = null;
  t: TFolder | TFile;
  depth: number; // 样式渲染需要知道节点的深度
  // 子节点
  children: ZoneNode[];

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
  }

  static renderTree(path: string) {

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

  renderItem() {
    if (this.t instanceof TFolder) {
      this.renderFolderItem();
      console.log(this.t);
    } else if (this.t instanceof TFile) {
      console.log('TFile');
      console.log(this.t);
    } else {
      console.log('not folder and file');
      console.log(this.t)
    }
  }

  renderFolderItem() {
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

  renderFileItem() {}

  // 前序遍历 N 叉树
  preOrderTraversal(result: ZoneNode[]): void {
    result.push(this);
    this.children.forEach(e => e.preOrderTraversal(result));
  }
}

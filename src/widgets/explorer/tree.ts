import { TFolder, TFile } from 'obsidian';
import { ZoneView } from './view';

export class ZoneNode {
  // tree
  tree: ZoneTree;
  parent: ZoneNode | null = null;
  children: ZoneNode[];
  depth: number; // 样式渲染需要知道节点的深度
  // chain
  previous: ZoneNode | null = null;
  next: ZoneNode | null = null;
  // value
  t: TFolder | TFile | null;
  // dom
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  // 文件夹节点专有元素
  treeItemIcon: HTMLElement | null = null;
  treeItemChildren: HTMLElement | null = null;
  // 文件节点专有元素
  tName: string;
  tExt: string;

  constructor(tree: ZoneTree, path: string) {
    this.tree = tree;
    this.t = this.tree.view.app.vault.getFolderByPath(path);
    this.sortChildrenT();
  }

  showChildren(mountedEl: HTMLElement, depth: number) {
    this.children.forEach(node => node.showSelf(mountedEl, depth+1));
  }

  showSelf(mountedEl: HTMLElement, depth: number) {
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
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${this.tree.view.paddingLeft} + ${depth * 17}px) !important;`
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

  focus() {
    this.treeItemSelf.addClass('has-focus')
  }
  unfocus() {
    this.treeItemSelf.removeClass('has-focus');
  }
  active() {
    this.treeItemSelf.addClass('is-active')
  }
  unactive() {
    this.treeItemSelf.removeClass('is-active');
  }
}

export class ZoneTree {
  // 视图
  view: ZoneView;
  // tree
  root: ZoneNode | null = null;
  // chain
  first: ZoneNode | null = null;
  last: ZoneNode | null = null;
  // value
  focused: ZoneNode | null = null;
  actived: ZoneNode | null = null;

  // 是否显示根节点
  enableShowRoot: boolean = false;

  // 拿到根节点，创建一个树
  constructor(view: ZoneView) {
    this.view = view;
  }

  // create root
  showRoot(path: string, mountedEl: HTMLElement) {
    this.root = new ZoneNode(this, path);
    if (this.enableShowRoot) {
      this.root.showSelf(mountedEl, 0);
    } else {
      this.root.showChildren(mountedEl, -1);
    }
  }

}
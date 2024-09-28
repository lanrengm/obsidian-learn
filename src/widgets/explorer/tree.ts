import { TFolder, TFile } from 'obsidian';
import { ZoneView } from './view';

// 断开两个节点的连接
function unlink(previous: ZoneNode | null, next: ZoneNode | null): void {
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

// 连接两个节点
function link(previous: ZoneNode | null, next: ZoneNode | null): void {
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

// 在链中插入节点，保证链的连续性
function insertNode(previous: ZoneNode | null, node: ZoneNode | null): void {
  let next = previous?.next ?? null;
  link(previous, node);
  link(node, next);
}

class ZoneNode {
  // tree
  tree: ZoneTree;
  depth: number; // 样式渲染需要知道节点的深度
  // chain
  previous: ZoneNode | null = null;
  next: ZoneNode | null = null;
  // dom
  item: HTMLElement;
  itemTitle: HTMLElement;

  constructor(tree: ZoneTree, mountedEl: HTMLElement, depth: number) {
    this.tree = tree;
    // init
    this.item = createDiv({cls: 'tree-item'});
    this.itemTitle = this.item.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${this.tree.view.paddingLeft} + ${depth * 17}px) !important;`
      }
    });
    // mount
    mountedEl.appendChild(this.item);
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

class ZoneFolder extends ZoneNode {
  tFolder: TFolder;
  children: ZoneNode[];
  // 文件夹节点专有元素
  itemTitleIcon: HTMLElement;
  itemTitleText: HTMLElement;
  itemChildren: HTMLElement;
  
  constructor(tree: ZoneTree, mountedEl: HTMLElement, depth: number, tFolder: TFolder) {
    // init
    super(tree, mountedEl, depth);
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
    this.tFolder = tFolder;
    this.itemTitleText.setText(
      this.tFolder.path === '/' ? this.tFolder.path : this.tFolder.name
    );
    this.registerMouseClick();
  }

  registerMouseClick() {
    this.itemTitle.onClickEvent(evt => {
      this.tree.focus(this);
      this.expandFolder();
    });
  }

  expandFolder() {
    let folderArr: TFolder[] = [];
    let fileArr: TFile[] = [];
    this.tFolder.children.forEach(e => e instanceof TFolder ? folderArr.push(e) : fileArr.push(e as TFile));
    let previous: ZoneNode = this;
    folderArr.forEach(e => {
      let node = new ZoneFolder(this.tree, this.itemChildren, this.depth + 1, e);
      this.children.push(node);
      insertNode(previous, node);
      previous = node;
    });
    fileArr.forEach(e => {
      let node = new ZoneFile(this.tree, this.itemChildren, this.depth + 1, e);
      this.children.push(node);
      insertNode(previous, node);
      previous = node;
    });
  }
}

class ZoneFile extends ZoneNode {
  tFile: TFile;
  // 文件节点专有元素
  tName: string;
  tExt: string;

  constructor(tree: ZoneTree, mountedEl: HTMLElement, depth: number, tFile: TFile) {
    super(tree, mountedEl, depth);
    this.tFile = tFile;
    // render
    this.item.addClass('nav-file');
    this.itemTitle.addClasses(['nav-file-title', 'tappable']);
    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let res: string[] | null = re.exec(this.tFile.name);
    if (res) {
      this.tName = res[1];
      this.tExt = res[2] === 'md'? '' : res[2];
    } else {
      this.tName = this.tFile.name;
      this.tExt = 'nul';
    }
    // inner
    this.itemTitle.createDiv({
      text: this.tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
    // tag
    this.itemTitle.createDiv({
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
  first: ZoneNode | null = null;
  last: ZoneNode | null = null;
  // value
  focused: ZoneNode | null = null;
  actived: ZoneNode | null = null;

  // 拿到根节点，创建一个树
  constructor(view: ZoneView, mountedEl: HTMLElement, path: string) {
    this.view = view;
    // show root
    let tFolder = this.view.app.vault.getFolderByPath(path);
    if (tFolder) {
        this.root = new ZoneFolder(this, mountedEl, 0, tFolder);
    } else {
      throw new Error(`文件树根节点 ${path} 不是目录`);
    }
  }

  focus(node: ZoneNode) {
    this.focused?.unfocus();
    node.focus();
    this.focused = node;
  }
}

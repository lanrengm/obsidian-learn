import { Setting, View, ItemView, WorkspaceLeaf, TFile, TFolder, TAbstractFile, Notice, addIcon, setIcon, removeIcon } from "obsidian";
import { Widget } from '../widget';


export interface Settings {
  enableWidget: boolean;
}

export const SETTINGS: Settings = {
  enableWidget: false,
}

export class WidgetExplorer extends Widget {
  settings: Settings;

  explorerIcon: HTMLElement | null = null;

  displaySettingTab(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('Zone 文件浏览器')
      .setDesc('特殊的文件浏览器')
      .addToggle(toggle => toggle
        .setValue(this.settings.enableWidget)
        .onChange(async value => {
          this.settings.enableWidget = value;
          await this.plugin.saveSettings();
          if (value) {
            this.enableWidget();
          } else {
            this.disableWidget();
          }
        }));
  }

  async onload() {
    if (this.settings.enableWidget) {
      this.enableWidget();
    }
    // 注册 View
    this.plugin.registerView(VIEW_TYPE, (leaf) => new ZoneView(leaf));
  }

  onunload(): void {
    this.disableWidget();
  }

  enableWidget(): void {
    this.plugin.addRibbonIcon('list-tree', 'Restart zone explorer.', e => {
      this.hideExplorer();
      this.showExplorer();
    });
    this.showExplorer();
  }

  disableWidget(): void {
    this.explorerIcon?.remove();
    this.explorerIcon = null;
    this.hideExplorer();
  }

  async showExplorer() {
    const { workspace } = this.plugin.app;
    // 显示 View
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
      workspace.revealLeaf(leaf!);
    } else {
      leaf = workspace.getLeftLeaf(false);
      await leaf?.setViewState({ type: VIEW_TYPE, active: true });
    }
  }

  hideExplorer() {
    const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
      leaves[0].view.containerEl.remove();
      leaves[0].detach();
    }
  }
}

const VIEW_TYPE = "zone-explorer";

class ZoneView extends View {
  icon: string = 'list-tree';
  navigation: boolean = false;
  navFilesContainer: HTMLElement;
  // 光标框预选的文件或文件夹
  focusedItem: HTMLElement | null = null;
  // 记录当前选中的文件或文件夹，实现文件夹展开与折叠
  activedItem: HTMLElement | null = null;
  // 记录 padding-left
  paddingLeft: string = '24px';

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Zone Explorer";
  }

  async onOpen(): Promise<void> {
    this.navFilesContainer = this.containerEl.createDiv({
      cls: ['nav-files-container', 'node-insert-event', 'show-unsupported'],
      attr: {
        'tabindex': '-1', // 使 div 能够监听键盘事件
      }
    })
    let div = this.navFilesContainer.createDiv();
    // 获取左边距
    let paddingDiv = div.createDiv({attr: {
      'style': 'padding: var(--nav-item-padding);'
    }});
    this.paddingLeft = paddingDiv.getCssPropertyValue('padding-left');
    // 显示目录树
    this.showFolderToEl('/', div, 0);
    // 方向键监听
    this.navFilesContainer.addEventListener('keydown', (evt) => {
      console.log(evt)
      if (evt.key === 'ArrowDown') {
        if (!this.focusedItem) {
          let els = this.navFilesContainer.getElementsByClassName('tree-item-self');
          if (els.length > 0) {
            let treeItem;
            this.focusedItem = els[0] as HTMLElement;
            console.log(this.focusedItem);
            this.focusedItem.addClass('has-focus');
          }
        } else {
          console.log(this.focusedItem.nextSibling);
        }
      }
    });
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  // 循环展开目录
  showFolderToEl(path: string, el: HTMLElement, deep: number) {
    let root = this.app.vault.getFolderByPath(path);

    // 分离 folder 和 file
    let folderList: Array<TFolder> = [];
    let fileList: Array<TFile> = [];
    root?.children.forEach((t) => t instanceof TFolder ? folderList.push(t) : fileList.push(t as TFile));
    folderList.sort();
    fileList.sort();

    // 渲染文件夹部分 nav-folder
    folderList.forEach(t => new ZoneFolder(this, el, deep, t));
    // 渲染文件部分 nav-file
    fileList.forEach(t => new ZoneFile(this, el, deep, t));
  }
}

abstract class ZoneNode {
  // 扁平化的树
  private static _list: ZoneNode[];
  private static _index: number | null = null;
  // 根节点
  private static _root: ZoneNode | null = null;

  // 节点值
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  treeItemChildren: HTMLElement | null = null;
  t: TFolder | TFile;
  depth: number; // 样式渲染需要知道节点的深度
  // 子节点
  children: ZoneNode[];

  constructor(t: TFolder, depth: number) {
    this.t = t;
    this.depth = depth;

    this.treeItem = createDiv();
    this.treeItemSelf = this.treeItem.createDiv();
  }

  open() {}

  close() {}

  up() {}

  down() {}

  // 设置为根节点
  setToRoot() {
    ZoneNode._root = this;
  }

  createFolderItem() {}

  createFileItem() {}

  // 前序遍历 N 叉树
  preOrderTraversal(result: ZoneNode[]): void {
    result.push(this);
    this.children.forEach(e => e.preOrderTraversal(result));
  }
}

abstract class ZoneAbstractFile {
  view: ZoneView;
  parent: HTMLElement;
  deep: number; // 当前文件夹的深度，用来计算左侧padding
  t: TAbstractFile;

  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;

  constructor (view: ZoneView, parent: HTMLElement, deep: number, t:TAbstractFile) {
    this.view = view;
    this.parent = parent;
    this.deep = deep;
    this.t = t;

    this.treeItem = this.parent.createDiv({cls: 'tree-item'})
    this.treeItemSelf = this.treeItem.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${this.deep * 17}px !important; padding-inline-start: calc( ${this.view.paddingLeft} + ${this.deep * 17}px) !important;`
      }
    });

    this.init();
    this.registerMouseClick();
    this.registerKeyPress();
  }
  
  // has-focus 是外边框变化，可以用键盘方向键控制，作用是光标指示器。
  focusSelf() {
    this.view.activedItem?.removeClass('is-active');
    this.treeItemSelf.addClass('is-active');
    this.view.activedItem = this.treeItemSelf;
  }

  // is-active 是背景变化，鼠标单击选中，或方向键切换is-active后按回车选中，作用是指示当前正在编辑的文件。
  activeSelf() {
    this.view.focusedItem?.removeClass('has-focus');
    this.treeItemSelf.addClass('has-focus');
    this.view.focusedItem = this.treeItemSelf;
    console.log(this.view.activedItem);
  }

  abstract init(): void;

  abstract registerMouseClick(): void;

  abstract registerKeyPress(): void;
}

class ZoneFolder extends ZoneAbstractFile {
  treeItemIcon: HTMLElement;
  treeItemChildren: HTMLElement | null = null;

  init() {
    this.treeItem.addClasses(['nav-folder', 'is-collapsed']);
    this.treeItemSelf.addClasses(['nav-folder-title', 'mod-collapsible']);
    this.createIcon();
    this.createText();
  }

  registerMouseClick(): void {
    // 点击目录的事件
    // 第一次点击当前目录是选中，第二次点击是展开子目录，第三次点击是收起子目录
    this.treeItemSelf.onClickEvent(evt => {
      if (this.view.focusedItem !== this.treeItemSelf) {
        this.focusSelf();
        this.activeSelf();
      } else if(!this.treeItemChildren) {
        this.expandChildren();
      } else {
        this.collapseChildren();
      }
    });
  }

  registerKeyPress(): void {
    this.view.containerEl
  }

  private createIcon() {
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
  }

  private createText() {
    this.treeItemSelf.createDiv({
      text: this.t.name,
      cls: ['tree-item-inner', 'nav-folder-title-content']
    });
  }

  // 展开子目录
  expandChildren() {
    this.treeItem.removeClass('is-collapsed')
    this.treeItemIcon.removeClass('is-collapsed');
    this.treeItemChildren = this.treeItem.createDiv({
      cls: ['tree-item-children', 'nav-folder-children']
    });
    this.view.showFolderToEl(this.t.path, this.treeItemChildren, this.deep + 1);
  }

  // 收起子目录
  collapseChildren() {
    this.treeItem.addClass('is-collapsed');
    this.treeItemIcon.addClass('is-collapsed');
    this.treeItemChildren?.remove();
    this.treeItemChildren = null;
  }

}

class ZoneFile extends ZoneAbstractFile {
  tName: string;
  tExt: string;

  init(): void {
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

    this.createText();
    this.createTag();
  }

  registerMouseClick(): void {
    this.treeItem.onClickEvent(evt => {
      this.activeSelf();
      this.focusSelf();
    });
  }

  registerKeyPress(): void {
    
  }

  createText() {
    this.treeItemSelf.createDiv({
      text: this.tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
  }

  createTag() {
    this.treeItemSelf.createDiv({
      text: this.tExt,
      cls: 'nav-file-tag'
    });
  }
}
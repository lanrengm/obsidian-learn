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
  // 记录当前选中的文件或文件夹，实现文件夹展开与折叠
  focusedItem: HTMLElement | null = null;
  // 记录 padding-left
  paddingLeft: string = '24px';

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Zone Explorer";
  }

  async onOpen(): Promise<void> {
    let navFilesContainer = this.containerEl.createDiv({
      cls: ['nav-files-container', 'node-insert-event', 'show-unsupported']
    })
    let div = navFilesContainer.createDiv();
    // 获取左边距
    let paddingDiv = div.createDiv({attr: {
      'style': 'padding: var(--nav-item-padding);'
    }});
    this.paddingLeft = paddingDiv.getCssPropertyValue('padding-left');
    // 显示目录树
    this.showFolderToEl('/', div, 0);
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
    folderList.forEach(t => new ZoneFolder(this, t, el, deep));
    // 渲染文件部分 nav-file
    fileList.forEach(t => new ZoneFile(this, t, el, deep));
  }
}

class ZoneFolder {
  view: ZoneView;
  t: TFolder;
  deep: number; // 当前文件夹的深度，用来计算左侧padding
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  treeItemIcon: HTMLElement;
  treeItemChildren: HTMLElement | null = null;

  constructor(view: ZoneView, t: TFolder, parent: HTMLElement, deep: number) {
    this.view = view;
    this.t = t;
    this.deep = deep;
    this.treeItem = parent.createDiv({
      cls: ['tree-item', 'nav-folder', 'is-collapsed', 
        'mod-root', // 此 class 用来兼容 ITS Theme
      ]
    });
    this.treeItemSelf = this.treeItem.createDiv({
      cls: [
        'tree-item-self', 'is-clickable',
        'nav-folder-title', 'mod-collapsible'
      ],
      attr: {
        'style': `margin-inline-start: -${this.deep * 17}px !important; padding-inline-start: calc( ${this.view.paddingLeft} + ${this.deep * 17}px) !important;`
      }
    });
    this.createIcon();
    this.createText();
    // 点击目录的事件
    // 第一次点击当前目录是选中，第二次点击是展开子目录，第三次点击是收起子目录
    this.treeItemSelf.onClickEvent(evt => {
      if (this.view.focusedItem !== this.treeItemSelf) {
        // 第一次点击当前文件夹, 取消其它文件或目录的选中
        this.view.focusedItem?.removeClasses(['is-active', 'has-focus']);
        this.treeItemSelf.addClasses(['is-active', 'has-focus']);
        this.view.focusedItem = this.treeItemSelf;
      } else {
        // 再次点击当前文件夹，展开或折叠目录
        !this.treeItemChildren ? this.expand() : this.collapse();
      }
    })
  }
  
  // 展开子目录
  expand() {
    this.treeItem.removeClass('is-collapsed')
    this.treeItemIcon.removeClass('is-collapsed');
    this.treeItemChildren = this.treeItem.createDiv({
      cls: ['tree-item-children', 'nav-folder-children']
    });
    this.view.showFolderToEl(this.t.path, this.treeItemChildren, this.deep + 1);
  }

  // 收起子目录
  collapse() {
    this.treeItem.addClass('is-collapsed');
    this.treeItemIcon.addClass('is-collapsed');
    this.treeItemChildren?.remove();
    this.treeItemChildren = null;
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
}

class ZoneFile {
  view: ZoneView;
  t: TFile;
  deep: number;
  
  constructor(view: ZoneView, t: TFile, parent: HTMLElement, deep: number) {
    this.view = view;
    this.t = t;
    this.deep = deep;

    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let tName: string;
    let tExt: string;
    let res: string[] | null = re.exec(t.name);
    if (res) {
      tName = res[1];
      tExt = res[2] === 'md'? '' : res[2];
    } else {
      tName = t.name;
      tExt = 'nul';
    }

    let treeItem = parent.createDiv({
      cls: ['tree-item', 'nav-file', 'mod-root']
    });
    let treeItemSelf = treeItem.createDiv({
      cls: [
        'tree-item-self', 'is-clickable', 
        'nav-file-title', 'tappable'
      ],
      attr: {
        'style': `margin-inline-start: -${this.deep * 17}px !important; padding-inline-start: calc(${this.view.paddingLeft} + ${this.deep * 17}px) !important;`
      }
    });
    let treeItemInner = treeItemSelf.createDiv({
      text: tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
    let navFileTag = treeItemSelf.createDiv({
      text: tExt,
      cls: 'nav-file-tag'
    });

    // 点击文件的事件
    treeItem.onClickEvent(evt => {
      // is-active 是外边框变化，可以用键盘方向键控制，作用是光标指示器。
      // has-focus 是背景变化，鼠标单击选中，或方向键切换is-active后按回车选中，作用是指示当前正在编辑的文件。
      // 取消其它文件或目录的选中
      this.view.focusedItem?.removeClasses(['is-active', 'has-focus']);
      // 选中当前文件
      treeItemSelf.addClasses(['is-active', 'has-focus']);
      this.view.focusedItem = treeItemSelf;
    });

  }
}
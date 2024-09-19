import { Setting, ItemView, WorkspaceLeaf, TFile, TFolder, TAbstractFile, Notice, addIcon, setIcon, removeIcon } from "obsidian";
import { Widget } from '../widget';

import myicon1 from './icons/myicon1.svg';

const ICON_1 = 'myicon1';

export interface Settings {
  enableWidget: boolean;
}

export const SETTINGS: Settings = {
  enableWidget: false,
}

export class WidgetExplorer extends Widget {
  settings: Settings;

  explorerIcon: HTMLElement | null = null;
  explorer: View | null = null;

  icon1: HTMLElement | null = null;

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

  onload() {
    if (this.settings.enableWidget) {
      this.enableWidget();
    }
    // 注册 View
    this.plugin.registerView(VIEW_TYPE, (leaf) => new View(leaf));
  }

  onunload(): void {
    this.disableWidget();
  }

  enableWidget(): void {
    addIcon(ICON_1, myicon1);
    this.explorerIcon = this.plugin.addRibbonIcon('myicon1', 'open my explorer',
      (e) => this.showExplorer());
  }

  disableWidget(): void {
    if (this.explorerIcon) {
      this.explorerIcon.remove();
      this.explorerIcon = null;
    }
    if (this.icon1) {
      this.icon1.remove();
      this.icon1 = null;
    }
    removeIcon(ICON_1);
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
      await leaf!.setViewState({ type: VIEW_TYPE, active: true });
    }
  }
}

const VIEW_TYPE = "explorer-view";

class View extends ItemView {
  navigation: boolean = false;
  // 记录当前选中的文件或文件夹
  // 实现两次点击同一个文件夹展开
  focusedItem: HTMLElement | null = null;

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "My Explorer";
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;

    contentEl.addClasses(['nav-files-container', 'node-insert-event', 'show-unsupported']);
    let div = contentEl.createDiv();
    this.showFolderToEl('/', div);
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  // 循环展开目录
  showFolderToEl(path: string, el: HTMLElement) {
    const { vault } = this.app;

    let root = vault.getFolderByPath(path);
    // 分离 folder 和 file
    let folderList: Array<TFolder> = [];
    let fileList: Array<TFile> = [];
    root?.children.forEach((t) => t instanceof TFolder ? folderList.push(t) : fileList.push(t as TFile));
    folderList.sort();
    fileList.sort();

    // 处理文件夹部分 nav-folder
    folderList.forEach(t => {
      let treeItem = el.createDiv({
        cls: ['tree-item', 'nav-folder', 'is-collapsed']
      });
      let treeItemSelf = treeItem.createDiv({
        cls: [
          'tree-item-self', 'is-clickable',
          'nav-folder-title', 'mod-collapsible'
        ]
      });
      let treeItemIcon = treeItemSelf.createDiv({ 
        cls: ['tree-item-icon', 'nav-folder-collapse-indicator', 'collapse-icon', 'is-collapsed']
      });
      // 模仿文件管理器部分的 【展开/收起】 图标
      // '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>'
      let svgIcon = treeItemIcon.createSvg('svg', {
        attr: {
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
        }
      });
      svgIcon.createSvg('path', {
        attr: {
          'd': 'M3 8L12 17L21 8'
        }
      });
      let treeItemInner = treeItemSelf.createDiv({
        text: t.name,
        cls: ['tree-item-inner', 'nav-folder-title-content']
      });

      // 点击目录的事件
      // 第一次点击是选中，第二次点击是展开子目录，第三次点击是收起子目录
      treeItemSelf.onClickEvent(evt => {
        if (this.focusedItem === treeItemSelf) {
          // 点击已选中文件夹, 等同于双击
          if (treeItem.children.length === 1) {
            // 展开子目录
            treeItem.removeClass('is-collapsed');
            treeItemIcon.removeClass('is-collapsed');
            let navFolderChildren = treeItem.createDiv({
              cls: ['tree-item-children', 'nav-folder-children']
            });
            this.showFolderToEl(t.path, navFolderChildren);
          } else {
            // 收起子目录
            treeItem.addClass('is-collapsed');
            treeItemIcon.addClass('is-collapsed');
            treeItem.children[1].remove();
          }
        } else {
          // 点击新的文件夹, 取消其它文件或目录的选中
          this.focusedItem?.removeClasses(['is-active', 'has-focus']);
          // 选中当前目录
          treeItemSelf.addClasses(['is-active', 'has-focus']);
          this.focusedItem = treeItemSelf;
        }
      });
    });

    // 处理文件部分 nav-file
    fileList.forEach(t => {
      let treeItem = el.createDiv({
        cls: ['tree-item', 'nav-file']
      });
      let treeItemSelf = treeItem.createDiv({
        cls: [
          'tree-item-self', 'is-clickable', 
          'nav-file-title', 'tappable'
        ]
      });
      let treeItemInner = treeItemSelf.createDiv({
        text: t.name,
        cls: ['tree-item-inner', 'nav-file-title-content']
      });

      // 点击文件的事件
      treeItem.onClickEvent(evt => {
        // is-active 是外边框变化，可以用键盘方向键控制，作用是光标指示器。
        // has-focus 是背景变化，鼠标单击选中，或方向键切换is-active后按回车选中，作用是指示当前正在编辑的文件。
        // 取消其它文件或目录的选中
        this.focusedItem?.removeClasses(['is-active', 'has-focus']);
        // 选中当前文件
        treeItemSelf.addClasses(['is-active', 'has-focus']);
        this.focusedItem = treeItemSelf;
      });
    })
  }
}

class ZoneFolder {
  view: View;
  t: TFolder;
  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;
  treeItemIcon: HTMLElement;
  treeItemChildren: HTMLElement | null = null;

  constructor(view: View, t: TFolder, parent: HTMLElement) {
    this.view = view;
    this.t = t;
    this.treeItem = parent.createDiv({
      cls: ['tree-item', 'nav-folder', 'is-collapsed']
    });
    this.treeItemSelf = this.treeItem.createDiv({
      cls: [
        'tree-item-self', 'is-clickable',
        'nav-folder-title', 'mod-collapsible'
      ]
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
    this.view.showFolderToEl(this.t.path, this.treeItemChildren);
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
  view: View;
  t: TFile;
  
  constructor(view: View, t: TFile, parent: HTMLElement) {
    this.view = view;
    this.t = t;

    let treeItem = parent.createDiv({
      cls: ['tree-item', 'nav-file']
    });
    let treeItemSelf = treeItem.createDiv({
      cls: [
        'tree-item-self', 'is-clickable', 
        'nav-file-title', 'tappable'
      ]
    });
    let treeItemInner = treeItemSelf.createDiv({
      text: t.name,
      cls: ['tree-item-inner', 'nav-file-title-content']
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
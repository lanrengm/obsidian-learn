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
  focusedEl: HTMLElement | null = null;

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "My Explorer";
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;

    this.showFolderToEl('/', contentEl);
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
      let navFolder = el.createDiv({ cls: 'tree-item nav-folder is-collapsed' });
      let navFolderTitle = navFolder.createDiv({ cls: 'tree-item-self nav-folder-title' });
      let navFolderCollapseIndicator = navFolderTitle.createDiv({ 
        cls: 'tree-item-icon collapse-icon nav-folder-collapse-indicator is-collapsed'
      });
      // let svgIcon = navFolderCollapseIndicator.createSvg('svg', {cls: 'svg-icon right-triangle'});
      // setIcon(navFolderCollapseIndicator, 'myicon1');
      let navFolderTitleContent = navFolderTitle.createDiv({
        text: t.name,
        cls: 'tree-item-inner nav-folder-title-content'
      });

      // 点击目录的事件
      // 第一次点击是选中，第二次点击是展开子目录，第三次点击是收起子目录
      navFolderTitle.onClickEvent(evt => {
        if (this.focusedEl === navFolderTitle) {
          // 点击已选中文件夹, 等同于双击
          if (navFolder.children.length === 1) {
            // 展开子目录
            let navFolderChildren = navFolder.createDiv({cls: 'tree-item-children nav-folder-children'});
            this.showFolderToEl(t.path, navFolderChildren);
          } else {
            // 收起子目录
            navFolder.children[1].remove();
          }
        } else {
          // 点击新的文件夹
          // 取消其它文件或目录的选中
          this.focusedEl?.removeClasses(['is-active', 'has-focus']);
          // 选中当前目录
          navFolderTitle.addClasses(['is-active', 'has-focus']);
          this.focusedEl = navFolderTitle;
        }
      });
    });

    // 处理文件部分 nav-file
    fileList.forEach(t => {
      let navFile = el.createDiv({ cls: 'tree-item nav-file' });
      let navFileTitle = navFile.createDiv({ cls: 'tree-item-self nav-file-title is-clickable tappable' });
      let navFileTitleContent = navFileTitle.createDiv({
        text: t.name,
        cls: 'tree-item-inner nav-file-title-content'
      });

      // 点击文件的事件
      navFile.onClickEvent(evt => {
        // is-active 是外边框变化，可以用键盘方向键控制，作用是光标指示器。
        // has-focus 是背景变化，鼠标单击选中，或方向键切换is-active后按回车选中，作用是指示当前正在编辑的文件。
        // 取消其它文件或目录的选中
        this.focusedEl?.removeClasses(['is-active', 'has-focus']);
        // 选中当前文件
        navFileTitle.addClasses(['is-active', 'has-focus']);
        this.focusedEl = navFileTitle;
      });
    })
  }

  openFolder(t: TFolder): void {

  }

  closeFolder(t: TFolder): void {

  }
}

import { View, TFolder, TFile } from 'obsidian';

import { ZoneFile, ZoneFolder } from './oldtree';
import { ZoneNode } from './tree';

export const VIEW_TYPE = "zone-explorer";

export class ZoneView extends View {
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
    ZoneNode.view = this;
    // 显示目录树
    // this.showFolderToEl('/', div, 0);
    // let rootT = this.app.vault.getFolderByPath('/');
    // if (rootT) {
    //   let rootZoneNode = new ZoneNode(rootT, 0);
    //   div.appendChild(rootZoneNode.treeItem);
    // }
    ZoneNode.renderTree('/', div);

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

import { View, TFolder, TFile } from 'obsidian';

import { ZoneFile, ZoneFolder } from './oldtree';
import { ZoneNode, ZoneTree } from './tree';

export const VIEW_TYPE = "zone-explorer";

export class ZoneView extends View {
  icon: string = 'list-tree';
  navigation: boolean = false;
  navFilesContainer: HTMLElement;
  tree1: ZoneTree | null = null;

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
    let mountedEl = this.navFilesContainer.createDiv();
    // 获取左边距
    ZoneNode.paddingLeft = mountedEl.createDiv({
      attr: {'style': 'padding: var(--nav-item-padding);'}
    }).getCssPropertyValue('padding-left');
    this.tree1 = new ZoneTree(this);
    this.tree1.setRoot('/').createTree(mountedEl);

    // 方向键监听
    this.navFilesContainer.addEventListener('keydown', (evt) => {
      console.log(evt.key);
      switch (evt.key) {
        case 'ArrowDown': {
          ZoneNode.downExplorerCursor();
          break;
        }
        case 'ArrowUp': {
          ZoneNode.upExplorerCursor();
          break;
        }
        case 'ArrowRight': {
          ZoneNode.expandCurrentFolder();
          break;
        }
        case 'ArrowLeft': {
          ZoneNode.collapseExplorerFolder();
          break;
        }
      }
    });
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }
}

import { View } from 'obsidian';

import { ElNullable, DOM } from './dom';
import { TFNullable, VTreeNode, VTreeNodeNullable, VTree, VTreeNullable } from './vtree';


export const VIEW_TYPE = "zone-explorer";

export class ZoneView extends View {
  icon: string = 'list-tree';
  navigation: boolean = false;
  navFilesContainer: HTMLElement;
  mountedPoint: ElNullable;

  paddingLeft: string = '24px';
  tree1: VTreeNullable = null;

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
    this.mountedPoint = this.navFilesContainer.createDiv();
    // 获取左边距
    this.paddingLeft = this.mountedPoint.createDiv({
      attr: {'style': 'padding: var(--nav-item-padding);'}
    }).getCssPropertyValue('padding-left');
    // 显示 tree
    let root = new VTreeNode(
      this.app.vault.getFolderByPath('/'),
      new DOM(this.paddingLeft, 0),
    );
    this.tree1 = new VTree(root).mount(this.mountedPoint);
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }
}

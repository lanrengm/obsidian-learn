import { View, TFile, WorkspaceLeaf } from 'obsidian';

import { VTreeNode, VTree } from './vtree';


export const VIEW_TYPE = "zone-explorer";

export class ZoneView extends View {
  icon: string = 'list-tree';
  navigation: boolean = false;
  navFilesContainer: HTMLElement;
  mountedPoint: HTMLElement | null;

  paddingLeft: string = '24px';
  usedTree: VTree | null = null;

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
        'tabindex': '1', // 使 div 能够监听键盘事件
      }
    });
    this.mountedPoint = this.navFilesContainer.createDiv();
    // 获取左边距
    this.paddingLeft = this.mountedPoint.createDiv({
      attr: {'style': 'padding: var(--nav-item-padding);'}
    }).getCssPropertyValue('padding-left');
    // 显示 tree
    // let root = new VTreeNode()
    //   .initDOM(this.paddingLeft, 0)
    //   .initTreeNode(this.app.vault.getFolderByPath('/'));
    // this.usedTree = new VTree(root).mount(this.mountedPoint);
    
    let root = new VTreeNode()
      .initDOM(this.paddingLeft, -1)
      .initTreeNode(this.app.vault.getFolderByPath('/'));
    this.usedTree = new VTree({root: root, view: this}).mountNulRoot(this.mountedPoint);
    // key event
    this.registerKeyEvent();
    this.registerMouseEvent();
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  registerKeyEvent() {
    this.navFilesContainer.addEventListener('keydown', evt => {
      console.log(evt.key);
      switch (evt.key) {
        case 'ArrowUp': {
          this.usedTree?.upCourse();
          break;
        }
        case 'ArrowDown': {
          this.usedTree?.donwCourse();
          break;
        }
        case 'ArrowLeft': {
          this.usedTree?.focused?.collapseChildren();
          break;
        }
        case 'ArrowRight': {
          this.usedTree?.focused?.expandChildren(this.usedTree);
          break;
        }
        case 'Enter': {
          if (this.usedTree?.focused) {
            this.usedTree.focused.openFile({
              leaf: this.app.workspace.getLeaf(false),
            });
          }
          break;
        }
      }
    });
  }

  registerMouseEvent() {
    this.navFilesContainer.onClickEvent(evt => {
      this.usedTree?.focused?.unfocus();
    });
  }
}

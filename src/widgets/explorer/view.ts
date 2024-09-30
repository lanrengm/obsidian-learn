import { View, TFile, WorkspaceLeaf } from 'obsidian';

import { VTree } from './tree';
import { WidgetExplorer } from './main';


export const VIEW_TYPE = "zone-explorer";

export class ZoneView extends View {
  widget: WidgetExplorer;
  icon: string = 'list-tree';
  navigation: boolean = false;
  navFilesContainer: HTMLElement;
  mountedPoint: HTMLElement | null;
  paddingLeft: string = '24px';
  usedTree: VTree | null = null;

  constructor(widget: WidgetExplorer, leaf: WorkspaceLeaf) {
    super(leaf);
    this.widget = widget;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Zone Explorer";
  }

  async onOpen(): Promise<void> {
    this.navFilesContainer = this.containerEl.createDiv({
      cls: ['nav-files-container', 'node-insert-event', 'show-unsupported'],
      attr: {'tabindex': '1'}, // 使 div 能够监听键盘事件
    });
    this.mountedPoint = this.navFilesContainer.createDiv();
    // 获取左边距
    this.paddingLeft = this.mountedPoint.createDiv({
      attr: {'style': 'padding: var(--nav-item-padding);'}
    }).getCssPropertyValue('padding-left');
    // 显示 tree
    this.usedTree = new VTree({view: this, rootPath: '/'});
    this.usedTree.mount();
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
          this.usedTree?.cursorUp();
          break;
        }
        case 'ArrowDown': {
          this.usedTree?.cursorDown();
          break;
        }
        case 'ArrowLeft': {
          this.usedTree?.focused?.folderCollapse();
          break;
        }
        case 'ArrowRight': {
          this.usedTree?.focused?.folderExpand();
          break;
        }
        case 'Enter': {
          if (this.usedTree?.focused) {
            this.usedTree.focused.active();
            this.usedTree.focused.openFile();
          }
          break;
        }
      }
    });
  }

  registerMouseEvent() {
    this.navFilesContainer.addEventListener('click', evt => {
      if (this.usedTree && this.usedTree.focused) {
        this.usedTree.focused.unfocus();
        this.usedTree.focused = null;
      }
    });
  }
}

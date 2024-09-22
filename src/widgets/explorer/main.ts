import { Setting, WorkspaceLeaf } from "obsidian";
import { Widget } from '../widget';

import { ZoneView, VIEW_TYPE }  from './view';


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

import { Setting, WorkspaceLeaf } from "obsidian";
import { Widget } from '../../widget';
import { Settings } from '../../settings';

import { ZoneView, VIEW_TYPE }  from './view';


export class WidgetExplorer extends Widget {
  settings: Settings['explorer'];

  explorerIcon: HTMLElement | null = null;

  displaySettingTab(containerEl: HTMLElement): void {
    new Setting(containerEl).setName('Zone 文件浏览器').setHeading();
    new Setting(containerEl)
      .setName('开启文件浏览器')
      .setDesc('全局开关，')
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
    new Setting(containerEl)
      .setName('显示根目录')
      .setDesc('点击工具栏图标重启 Zone 文件管理器后生效')
      .addToggle(toggle => toggle
        .setValue(this.settings.enableRoot)
        .onChange(async value => {
          this.settings.enableRoot = value;
          await this.plugin.saveSettings();
        }));
  }

  async onload() {
    if (this.settings.enableWidget) {
      this.enableWidget();
    }
    // 注册 View
    this.plugin.registerView(VIEW_TYPE, (leaf) => new ZoneView(this, leaf));
  }

  onunload(): void {
    this.disableWidget();
  }

  enableWidget(): void {
    this.explorerIcon = this.plugin.addRibbonIcon('list-tree', 'Restart zone explorer.', e => {
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

import { Setting, Modal, Editor, MarkdownView, ItemView, WorkspaceLeaf, ButtonComponent, Notice, TextComponent } from "obsidian";

import { Widget } from '../widget';
import { Settings } from '../settings';


export class WidgetTest extends Widget {
  settings: Settings['test'];

  displaySettingTab(containerEl: HTMLElement) {
    new Setting(containerEl).setName('Test Widget').setHeading();

    new Setting(containerEl)
      .setName('是否开启Test组件')
      .setDesc('Test 组件是用来写测试代码的')
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
        })
      );
  }

  onload() {
    this.enableWidget();
  }

  onunload(): void {
    this.disableWidget();
  }

  enableWidget(): void {
    const { plugin } = this;
    this.plugin.registerView(VIEW_TYPE_TEST, leaf => new TestView(leaf));
    this.plugin.addRibbonIcon('alert-triangle', 'Test View', async evt => {
      const { workspace } = this.plugin.app;
      let leaf: WorkspaceLeaf | null = null;
      const leaves = workspace.getLeavesOfType(VIEW_TYPE_TEST);
      if (leaves.length > 0) {
        leaf = leaves[0];
      } else {
        leaf = workspace.getLeaf(false);
        await leaf?.setViewState({ type: VIEW_TYPE_TEST, active: true});
      }
      workspace.revealLeaf(leaf);
    });
  }

  disableWidget(): void {  }
}

const VIEW_TYPE_TEST = 'view-type-test';

class TestView extends ItemView {
  icon: string = 'alert-triangle';
  getViewType(): string {
    return VIEW_TYPE_TEST;
  }
  getDisplayText(): string {
    return 'Test View';
  }
  protected async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    new ButtonComponent(contentEl).setClass('setBtnClass').setButtonText('开始');
    contentEl.createEl('div', {
      attr: {
        style: `height: 10px`
      }
    })
    new ButtonComponent(contentEl).setClass('setBtnClass').setButtonText('暂停');
    contentEl.createEl('div', {
      attr: {
        style: `height: 10px`
      }
    })
    new ButtonComponent(contentEl).setButtonText('结束').setClass('setBtnClass');
    contentEl.createEl('style', {
      text: `
        .setBtnClass {
          width: 100%;
        }
      `
    })
  }
}

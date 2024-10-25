import { Setting, Modal, Editor, MarkdownView } from "obsidian";

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

    new Setting(containerEl)
      .setName('xxx')
      .setDesc('xxx')
      .addText(text => text
        .setPlaceholder('Setting 1 placeholder')
        .setValue(this.settings.setting1)
        .onChange(async (value) => {
          this.settings.setting1 = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Setting #2')
      .setDesc('Setting 2 desc.')
      .addText(text => text
        .setPlaceholder('Setting 2 placeholder')
        .setValue(this.settings.setting2)
        .onChange(async (value) => {
          this.settings.setting2 = value;
          await this.plugin.saveSettings();
        }));
    
    new Setting(containerEl).setName('其它组件').setHeading();
  }

  onload() {
    this.enableWidget();
  }

  onunload(): void {
    this.disableWidget();
  }

  enableWidget(): void {
    const { plugin } = this;
    // This adds a simple command that can be triggered anywhere
    plugin.addCommand({
      id: 'open-sample-modal-simple',
      name: 'Open sample modal (simple)',
      callback: () => {
        new MyModal(plugin.app).open();
      }
    });
    // This adds an editor command that can perform some operation on the current editor instance
    plugin.addCommand({
      id: 'sample-editor-command',
      name: 'Sample editor command',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        console.log(editor.getSelection());
        editor.replaceSelection('Sample Editor Command');
      }
    });
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    let c = plugin.addCommand({
      id: 'open-sample-modal-complex',
      name: 'Open sample modal (complex)',
      checkCallback: (checking: boolean) => {
        // Conditions to check
        const markdownView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if (!checking) {
            new MyModal(plugin.app).open();
          }

          // This command will only show up in Command Palette when the check function returns true
          return true;
        }
      }
    });

  }

  disableWidget(): void {
  }
}

class MyModal extends Modal {

  onOpen() {
    const { titleEl, contentEl } = this;
    titleEl.setText('Title');
    contentEl.setText('Woah!');
    const c1 = contentEl.createDiv();
    c1.setText('xxx');

  }

  onClose() {
    const { titleEl, contentEl } = this;
    titleEl.empty();
    contentEl.empty();
  }
}

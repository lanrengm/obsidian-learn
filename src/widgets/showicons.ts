import { ItemView, Notice, setIcon, setTooltip, getIconIds, Setting, WorkspaceLeaf } from "obsidian";

import { Widget } from "./widget";


export interface Settings {
  enableWidget: boolean;
}

export const SETTINGS: Settings = {
  enableWidget: false,
}

export class WidgetShowIcons extends Widget {
  settings: Settings;

  icon1: HTMLElement | null = null;

  displaySettingTab(containerEl: HTMLElement) {
    new Setting(containerEl)
      .setName('显示已注册 SVG 图标')
      .setDesc('使用 setIcon() 函数注册到 Obsidain 内部的图标都可以显示。')
      .addToggle(toggle => toggle
        .setValue(this.settings.enableWidget)
        .onChange(async (value) => {
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

    this.plugin.registerView(VIEW_TYPE, (leaf) => new View(leaf));
  }

  onunload() {
    this.disableWidget();
  }

  enableWidget() {
    this.icon1 = this.plugin.addRibbonIcon("at-sign", "显示 Obsidian 内已注册的 SVG 图标", () => {
      this.activateView();
    });
  }

  disableWidget() {
    if (this.icon1) {
      this.icon1.remove();
      this.icon1 = null;
    }
    const leaves = this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
      leaves[0].detach();
    }
  }

  async activateView() {
    const { workspace } = this.plugin.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);
    if (leaves.length > 0) {
      leaf = leaves[0];
      if (workspace.getActiveViewOfType(View)) {
        leaf.detach();
      } else {
        workspace.revealLeaf(leaf);
      }
    } else {
      leaf = workspace.getLeaf('tab');
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
  }
}

const VIEW_TYPE = "builtin-icons-view";

class View extends ItemView {
  lucide_ids = getIconIds().filter(id => id.startsWith("lucide-")).map(id => id.slice(7));
  other_ids = getIconIds().filter(id => !id.startsWith("lucide-"));

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Icons";
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h1", { text: '已注册 SVG 图标' });
    contentEl.createEl("style", {
      attr: { scope: "" }, text: `
			.icon-table {
				display: flex;
				flex-wrap: wrap;
				margin: 0 var(--size-4-6);
			}
			
			.icon-item {
				padding: var(--size-4-2);
				line-height: 0;
				cursor: pointer;
			}
			
			.icon-item:hover {
				background-color: var(--background-modifier-active-hover);
				border-radius: var(--radius-s);
			}
		`});
    const searchEl = contentEl.createEl('input', { type: 'text' });
    const iconsTable = contentEl.createDiv();
    searchEl.addEventListener('input', (evt: InputEvent) => {
      const searchEl = evt.target as HTMLInputElement;
      const value = searchEl.value;
      iconsTable.empty();
      this.renderTable(String(value), iconsTable);
    });
    this.renderTable('', iconsTable);
  }

  async onClose() {
    this.containerEl.empty();
  }

  renderTable(value: string, iconsTable: HTMLElement) {
    if ( value === '' ) {
      iconsTable.createEl("p", { text: `${this.lucide_ids.length} Lucide icons.` });
      this.renderIconTable(this.lucide_ids, iconsTable);
  
      iconsTable.createEl("p", { text: `${this.other_ids.length} other icons.` });
      this.renderIconTable(this.other_ids, iconsTable);
    } else {
      let lucide_ids = this.lucide_ids.filter(id => id.includes(value));
      iconsTable.createEl("p", { text: `${lucide_ids.length} Lucide icons.` });
      this.renderIconTable(lucide_ids, iconsTable);

      let other_ids = this.other_ids.filter(id => id.includes(value));
      iconsTable.createEl("p", { text: `${other_ids.length} other icons.` });
      this.renderIconTable(other_ids, iconsTable);
    }
  }

  renderIconTable(ids: string[], iconsTable: HTMLElement) {
    const tableEl = iconsTable.createDiv("icon-table");
    ids.forEach((id) => {
      let iconEl = tableEl.createDiv("icon-item");
      setIcon(iconEl, id);
      setTooltip(iconEl, id, { delay: 0 });
      iconEl.onclick = () => {
        navigator.clipboard.writeText(id);
        new Notice("Copied to clipboard.");
      }
    });
  }
}

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
      console.log(getIconIds());
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

    let lucide_ids = getIconIds()
      .filter(id => id.startsWith("lucide-"))
      .map(id => id.slice(7));
    contentEl.createEl("p", { text: `${lucide_ids.length} Lucide icons.` });
    this.renderIconTable(lucide_ids);

    let other_ids = getIconIds().filter(id => !id.startsWith("lucide-"));
    contentEl.createEl("p", { text: `${other_ids.length} other icons.` });
    this.renderIconTable(other_ids);
  }

  async onClose() {
    this.containerEl.empty();
  }

  renderIconTable(ids: string[]) {
    const { contentEl } = this;
    const tableEl = contentEl.createDiv("icon-table");
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

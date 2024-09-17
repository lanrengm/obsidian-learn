import { ItemView, Notice, setIcon, setTooltip, getIconIds, Setting, WorkspaceLeaf } from "obsidian";

import MyPlugin from "../main";


export interface ShowIconsSettings {
	enableShowIcons: boolean;
}

export const SHOW_ICONS_SETTINGS: ShowIconsSettings = {
	enableShowIcons: false,
}

export const VIEW_TYPE_EXAMPLE = "my-icons-view";


export class ShowIcons {
	plugin: MyPlugin;

	constructor(plugin: MyPlugin) {
		this.plugin = plugin;
	}

	onload() {
		if(this.plugin.settings.showIconSettings.enableShowIcons) {
			this.showIcons();
		}
	}
	
	showIcons() {
		this.plugin.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);
		this.plugin.addRibbonIcon("shapes", "Show Icons", () => {
			this.activateView();
		});

	}

	async activateView() {
		const { workspace } = this.plugin.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getLeaf('tab');
			// workspace.getLeftLeaf
			await leaf!.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}
		workspace.revealLeaf(leaf!);
	}

	settingsDisplay() {
		const { containerEl } = this.plugin.settingTab;
		
		new Setting(containerEl)
			.setName('Enable show icons.')
			.setDesc('You can see builtin icons.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showIconSettings.enableShowIcons)
				.onChange(async (value) => {
					this.plugin.settings.showIconSettings.enableShowIcons = value;
					await this.plugin.saveSettings();
					if(value){
						this.showIcons();
					}
			}));
	}
}

export class ExampleView extends ItemView {
	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}
	
	getDisplayText(): string {
		return "Icons";
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
	
	async onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: 'Icons' });
		contentEl.createEl("style", { attr: { scope: "" }, text: `
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
		contentEl.createEl("p", { text: `${lucide_ids.length} Lucide icons.`});
		this.renderIconTable(lucide_ids);

		let other_ids = getIconIds().filter(id => !id.startsWith("lucide-"));
		contentEl.createEl("p", { text: `${other_ids.length} other icons.`});
		this.renderIconTable(other_ids);
	}
	
	async onClose() {
		this.containerEl.empty();
	}
}

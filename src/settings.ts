import { App, Setting, PluginSettingTab } from "obsidian";

import MyPlugin from "../main";

import { ShowIconsSettings, SHOW_ICONS_SETTINGS } from './widgets/showicons';

export interface MyPluginSettings {
	setting1: string;
	setting2: string;
	enableTimer: boolean;
	showIconSettings: ShowIconsSettings;
}

export const MY_SETTINGS: MyPluginSettings = {
	setting1: 'setting 1 default',
	setting2: 'setting 2 default',
	enableTimer: false,
	showIconSettings: SHOW_ICONS_SETTINGS,
}

export class MySettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('xxx')
			.setDesc('xxx')
			.addText(text => text
				.setPlaceholder('Setting 1 placeholder')
				.setValue(this.plugin.settings.setting1)
				.onChange(async (value) => {
					this.plugin.settings.setting1 = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('Setting #2')
		.setDesc('Setting 2 desc.')
		.addText(text => text
			.setPlaceholder('Setting 2 placeholder')
			.setValue(this.plugin.settings.setting2)
			.onChange(async (value) => {
				this.plugin.settings.setting2 = value;
				await this.plugin.saveSettings();
			}));
		
		new Setting(containerEl)
			.setName('正向计时器')
			.setDesc('统计工作时长')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableTimer)
				.onChange(async (value) => {
					this.plugin.settings.enableTimer = value;
					await this.plugin.saveSettings();
			}));
			
		this.plugin.showicons.settingsDisplay();
	}
}

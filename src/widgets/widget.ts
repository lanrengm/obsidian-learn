// Widget 是插件的插件，方便在一个 Obsidian Plugin 中添加多个互相独立的功能
// 本文件用来规范 Widget 的格式

import Main from "../main";

export class Widget {
  plugin: Main;
  settings: any;

  constructor(plugin: Main, settings: any) {
    this.plugin = plugin;
    this.settings = settings;
  }

  displaySettingTab(containerEl: HTMLElement): void {}

  onload(): void {}

  onunload(): void {}

  enableWidget(): void {}

  disableWidget(): void {}
}

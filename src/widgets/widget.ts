// Widget 是插件的插件，方便在一个 Obsidian Plugin 中添加多个互相独立的功能
// 本文件用来规范 Widget 的格式

import PluginMain from "../main";

export class Widget {
  plugin: PluginMain;

  constructor(plugin: PluginMain) {
    this.plugin = plugin;
  }
}
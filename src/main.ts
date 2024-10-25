import { Plugin, PluginSettingTab } from "obsidian";
import { Widget } from "./widget";
import { SETTINGS, Settings } from "./settings";

import * as test from "./widgets/test";
import * as timer from "./widgets/timer";
import * as explorer from "./widgets/explorer/main";

interface Widgets {
  [key: string]: Widget;
}

export default class Main extends Plugin {
  settings: Settings;
  settingTab: SettingTab;
  widgets: Widgets;

  async onload() {
    await this.loadSettings();
    this.settingTab = new SettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.widgets = {
      test: new test.WidgetTest(this, this.settings.test),
      timer: new timer.WidgetTimer(this, this.settings.timer),
      explorer: new explorer.WidgetExplorer(this, this.settings.explorer),
    };
    // 等到布局结束再启动插件，不然 Leaf 创建会出问题
    this.app.workspace.onLayoutReady(() => {
      Object.keys(this.widgets).forEach((key) => this.widgets[key].onload());
    });
  }

  onunload() {
    Object.keys(this.widgets).forEach((key) => this.widgets[key].onunload());
  }

  async loadSettings() {
    this.settings = Object.assign({}, SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SettingTab extends PluginSettingTab {
  plugin: Main;

  display(): void {
    const { containerEl } = this;
    const { widgets } = this.plugin;

    containerEl.empty();
    Object.keys(widgets).forEach((key) => widgets[key].displaySettingTab(containerEl));
  }
}

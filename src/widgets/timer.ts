// 计时器工具
import { Setting, setIcon } from 'obsidian';
import { Widget } from './widget';


type StatusBarIconButton = HTMLElement;

export interface Settings {
  enableWidget: boolean;
}

export const SETTINGS: Settings = {
  enableWidget: false,
}

export class WidgetTimer extends Widget {
  settings: Settings;

  timerDriver: NodeJS.Timer | null = null;
  timerCount: number = 0;

  timerLabel: HTMLElement | null;
  playBtn: HTMLElement | null;
  resetBtn: HTMLElement | null;

  displaySettingTab(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName('计时器')
      .setDesc('显示在状态栏的小工具，当做简化版的番茄钟来使用，用来统计工作时长')
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

  onload(): void {
    if (this.settings.enableWidget) {
      this.enableWidget();
    }
  }

  onunload(): void {
    this.disableWidget();
  }
  
  enableWidget(): void {
    const { plugin } = this;

    this.timerLabel = plugin.addStatusBarItem();
    this.playBtn = plugin.addStatusBarItem();
    this.resetBtn = plugin.addStatusBarItem();
    const { timerLabel, playBtn, resetBtn } = this;

    timerLabel.setText('00:00:00');
    setIcon(playBtn, 'play');
    setIcon(resetBtn, 'rotate-ccw');
    
    playBtn.addEventListener('click', () => {
      if (this.timerDriver) {
        // If the timer is running, to pause it.
        setIcon(playBtn, 'play');
        window.clearInterval(this.timerDriver!);
        this.timerDriver = null;
      } else {
        // If the timer was paused, to run it.
        setIcon(playBtn, 'pause');
        this.timerDriver = setInterval(() => {
          this.timerCount += 1;
          timerLabel.setText(`${
            String(Math.floor(this.timerCount / 3600)).padStart(2, '0')
          }:${
            String(Math.floor(this.timerCount / 60)).padStart(2, '0')
          }:${
            String(this.timerCount % 60).padStart(2, '0')
          }`);
        }, 1000);
      }
    });
    resetBtn.addEventListener('click', () => {
      if (this.timerDriver) {
        window.clearInterval(this.timerDriver!);
        this.timerDriver = null;
        setIcon(playBtn, 'play');
      }
      this.timerCount = 0;
      timerLabel.setText('00:00:00');
    });
  }

  disableWidget(): void {
    this.timerLabel?.remove();
    this.timerLabel = null;
    this.playBtn?.remove();
    this.playBtn = null;
    this.resetBtn?.remove();
    this.resetBtn = null;
  }
}
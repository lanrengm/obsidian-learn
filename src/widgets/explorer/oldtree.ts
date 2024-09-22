
import { TAbstractFile } from 'obsidian';
import { ZoneView } from './view';


export abstract class ZoneAbstractFile {
  view: ZoneView;
  parent: HTMLElement;
  deep: number; // 当前文件夹的深度，用来计算左侧padding
  t: TAbstractFile;

  treeItem: HTMLElement;
  treeItemSelf: HTMLElement;

  constructor (view: ZoneView, parent: HTMLElement, deep: number, t:TAbstractFile) {
    this.view = view;
    this.parent = parent;
    this.deep = deep;
    this.t = t;

    this.treeItem = this.parent.createDiv({cls: 'tree-item'});
    this.treeItemSelf = this.treeItem.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${this.deep * 17}px !important; padding-inline-start: calc( ${this.view.paddingLeft} + ${this.deep * 17}px) !important;`
      }
    });

    this.init();
    this.registerMouseClick();
    this.registerKeyPress();
  }
  
  // has-focus 是外边框变化，可以用键盘方向键控制，作用是光标指示器。
  focusSelf() {
    this.view.activedItem?.removeClass('is-active');
    this.treeItemSelf.addClass('is-active');
    this.view.activedItem = this.treeItemSelf;
  }

  // is-active 是背景变化，鼠标单击选中，或方向键切换is-active后按回车选中，作用是指示当前正在编辑的文件。
  activeSelf() {
    this.view.focusedItem?.removeClass('has-focus');
    this.treeItemSelf.addClass('has-focus');
    this.view.focusedItem = this.treeItemSelf;
    console.log(this.view.activedItem);
  }

  abstract init(): void;

  abstract registerMouseClick(): void;

  abstract registerKeyPress(): void;
}

export class ZoneFolder extends ZoneAbstractFile {
  treeItemIcon: HTMLElement;
  treeItemChildren: HTMLElement | null = null;

  init() {
    this.treeItem.addClasses(['nav-folder', 'is-collapsed']);
    this.treeItemSelf.addClasses(['nav-folder-title', 'mod-collapsible']);
    this.createIcon();
    this.createText();
  }

  registerMouseClick(): void {
    // 点击目录的事件
    // 第一次点击当前目录是选中，第二次点击是展开子目录，第三次点击是收起子目录
    this.treeItemSelf.onClickEvent(evt => {
      if (this.view.focusedItem !== this.treeItemSelf) {
        this.focusSelf();
        this.activeSelf();
      } else if(!this.treeItemChildren) {
        this.expandChildren();
      } else {
        this.collapseChildren();
      }
    });
  }

  registerKeyPress(): void {
    this.view.containerEl
  }

  private createIcon() {
    this.treeItemIcon = this.treeItemSelf.createDiv({ 
      cls: ['tree-item-icon', 'nav-folder-collapse-indicator', 'collapse-icon', 'is-collapsed']
    });
    // 模仿文件管理器部分的 【展开/收起】 图标
    // '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>'
    let svgIcon = this.treeItemIcon.createSvg('svg', { attr: {
      'xmlns': 'http://www.w3.org/2000/svg',
      'width': '24',
      'height': '24',
      'viewBox': '0 0 24 24',
      'fill': 'none',
      'stroke': 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'class': 'svg-icon right-triangle'
    }});
    svgIcon.createSvg('path', { attr: {
      'd': 'M3 8L12 17L21 8'
    }});
  }

  private createText() {
    this.treeItemSelf.createDiv({
      text: this.t.name,
      cls: ['tree-item-inner', 'nav-folder-title-content']
    });
  }

  // 展开子目录
  expandChildren() {
    this.treeItem.removeClass('is-collapsed')
    this.treeItemIcon.removeClass('is-collapsed');
    this.treeItemChildren = this.treeItem.createDiv({
      cls: ['tree-item-children', 'nav-folder-children']
    });
    this.view.showFolderToEl(this.t.path, this.treeItemChildren, this.deep + 1);
  }

  // 收起子目录
  collapseChildren() {
    this.treeItem.addClass('is-collapsed');
    this.treeItemIcon.addClass('is-collapsed');
    this.treeItemChildren?.remove();
    this.treeItemChildren = null;
  }

}

export class ZoneFile extends ZoneAbstractFile {
  tName: string;
  tExt: string;

  init(): void {
    this.treeItem.addClass('nav-file');
    this.treeItemSelf.addClasses(['nav-file-title', 'tappable']);

    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let res: string[] | null = re.exec(this.t.name);
    if (res) {
      this.tName = res[1];
      this.tExt = res[2] === 'md'? '' : res[2];
    } else {
      this.tName = this.t.name;
      this.tExt = 'nul';
    }

    this.createText();
    this.createTag();
  }

  registerMouseClick(): void {
    this.treeItem.onClickEvent(evt => {
      this.activeSelf();
      this.focusSelf();
    });
  }

  registerKeyPress(): void {
    
  }

  createText() {
    this.treeItemSelf.createDiv({
      text: this.tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
  }

  createTag() {
    this.treeItemSelf.createDiv({
      text: this.tExt,
      cls: 'nav-file-tag'
    });
  }
}
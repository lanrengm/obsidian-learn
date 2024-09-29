
export type ElNullable = HTMLElement | null;
export class DOM {
  item: HTMLElement;
  itemTitle: HTMLElement;
  itemTitleIcon: ElNullable = null;
  itemTitleText: ElNullable = null;
  itemTitleTag: ElNullable = null;
  itemChildren: ElNullable = null;
  isFolder: boolean = false;

  constructor(paddingLeft: string, depth: number) {
    // init
    this.item = createDiv({cls: 'tree-item'});
    this.itemTitle = this.item.createDiv({
      cls: ['tree-item-self', 'is-clickable'],
      attr: {
        'style': `margin-inline-start: -${depth * 17}px !important; padding-inline-start: calc( ${paddingLeft} + ${depth * 17}px) !important;`
      }
    });
  }

  createFolder(name: string): DOM {
    this.item.addClasses(['nav-folder', 'is-collapsed']);
    this.itemTitle.addClasses(['nav-folder-title', 'mod-collapsible']);
    this.itemTitleIcon = this.itemTitle.createDiv({ 
      cls: ['tree-item-icon', 'nav-folder-collapse-indicator', 'collapse-icon', 'is-collapsed']
    });
    // 模仿文件管理器部分的 【展开/收起】 图标
    // '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon right-triangle"><path d="M3 8L12 17L21 8"></path></svg>'
    let svgIcon = this.itemTitleIcon.createSvg('svg', { attr: {
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
    svgIcon.createSvg('path', { attr: {'d': 'M3 8L12 17L21 8'}});
    this.itemTitleText = this.itemTitle.createDiv({
      cls: ['tree-item-inner', 'nav-folder-title-content']
    });
    this.itemChildren = this.item.createDiv({
      cls: ['tree-item-children', 'nav-folder-children']
    });
    // set value
    this.itemTitleText?.setText(name);
    this.isFolder = true;
    return this;
  }

  createFile(name: string): DOM {
    // render
    this.item.addClass('nav-file');
    this.itemTitle.addClasses(['nav-file-title', 'tappable']);
    // 文件后缀名处理
    let re = /(.*)\.([A-Za-z]*)$/;
    let res: string[] | null = re.exec(name);
    let tName: string;
    let tExt: string;
    if (res) {
      tName = res[1];
      tExt = res[2] === 'md'? '' : res[2];
    } else {
      tName = name;
      tExt = 'nul';
    }
    // inner
    this.itemTitleText = this.itemTitle.createDiv({
      text: tName,
      cls: ['tree-item-inner', 'nav-file-title-content']
    });
    // tag
    this.itemTitleTag = this.itemTitle.createDiv({
      text: tExt,
      cls: 'nav-file-tag'
    });
    // set value
    this.isFolder = false;
    return this;
  }

  transToFile(name: string) {
    this.item.removeClasses(['nav-folder', 'is-collapsed']);
    this.itemTitle.removeClasses(['nav-folder-title', 'mod-collapsible']);
    this.itemTitle.empty();
    this.itemTitleIcon = null;
    this.itemTitleText = null;
    this.itemChildren?.remove();
    this.itemChildren = null;
    this.createFile(name);
    this.isFolder = false;
  }

  transToFolder(name: string) {
    this.item.removeClass('nav-file');
    this.itemTitle.removeClasses(['nav-file-title', 'tappable']);
    this.itemTitle.empty();
    this.itemTitleText = null;
    this.itemTitleTag = null;
    this.createFolder(name);
    this.isFolder = true;
  }

  focus() {
    this.itemTitle.addClass('has-focus')
  }
  unfocus() {
    this.itemTitle.removeClass('has-focus');
  }
  active() {
    this.itemTitle.addClass('is-active')
  }
  unactive() {
    this.itemTitle.removeClass('is-active');
  }

}
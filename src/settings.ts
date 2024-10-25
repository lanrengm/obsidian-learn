export interface Settings {
  test: {
    enableWidget: boolean;
    setting1: string;
    setting2: string;
  };
  showIcons: {
    enableWidget: boolean;
  };
  timer: {
    enableWidget: boolean;
  };
  explorer: {
    enableWidget: boolean;
    enableRoot: boolean;
  };
}

export const SETTINGS: Settings = {
  test: {
    enableWidget: false,
    setting1: 'setting 1 default',
    setting2: 'setting 2 default',
  },
  showIcons: {
    enableWidget: false,
  },
  timer: {
    enableWidget: false,
  },
  explorer: {
    enableWidget: false,
    enableRoot: false,
  },
}

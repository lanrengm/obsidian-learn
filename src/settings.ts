export interface Settings {
  test: {
    enableWidget: boolean;
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

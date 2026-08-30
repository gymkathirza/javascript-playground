export type Theme = "dark" | "light";

export type Settings = {
  autoRun: boolean;
  showUndefined: boolean;
  lineWrap: boolean;
  fontSize: number;
  theme: Theme;
  lineNumbers: boolean;
  activeLine: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  autoRun: true,
  showUndefined: false,
  lineWrap: true,
  fontSize: 16,
  theme: "dark",
  lineNumbers: false,
  activeLine: false,
};

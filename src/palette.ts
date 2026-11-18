export type Palette = readonly [
  lightest: string,
  light: string,
  dark: string,
  darkest: string,
];

export const PALETTES = {
  ui: ["#f8f0d8", "#d8c8a0", "#b04830", "#201818"],
  earth: ["#c8b48c", "#a89070", "#6c5844", "#302420"],
  grass: ["#c8b48c", "#9cb040", "#4c7838", "#203018"],
  rock: ["#c8c8d0", "#9090a0", "#585868", "#24242c"],
  mat: ["#c8b48c", "#e0a050", "#a83828", "#381810"],
  player: ["#f8d0a8", "#f8f8f8", "#d04828", "#282020"],
  sysadmin: ["#f8d0a8", "#90d0f8", "#4c7c58", "#202028"],
  terminal: ["#d0ffc8", "#48c060", "#707880", "#202428"],
  toaster: ["#f8f8f8", "#f8a040", "#a8a8b8", "#383848"],
  printer: ["#f8f8f8", "#80c0f0", "#c8c8c0", "#404048"],
  vacuum: ["#f8f8f8", "#f0d040", "#d04848", "#402020"],
} as const satisfies Readonly<Record<string, Palette>>;

export type PaletteName = keyof typeof PALETTES;

const [lightest, light, dark, darkest] = PALETTES.ui;

export const UI_PALETTE = { lightest, light, dark, darkest } as const;

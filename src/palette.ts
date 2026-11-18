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
  rubble: ["#c8b48c", "#a0a0a8", "#646470", "#2c2830"],
  glow: ["#c8b48c", "#d8ff70", "#58d030", "#1c4818"],
  "glow-dim": ["#c8b48c", "#98e050", "#40a028", "#1c4818"],
  barrel: ["#c8b48c", "#c8ff60", "#d8a830", "#302010"],
  "barrel-dim": ["#c8b48c", "#78c040", "#d8a830", "#302010"],
  scrap: ["#c8b48c", "#a8a8b0", "#c06830", "#302828"],
  rocket: ["#e8e8e0", "#c86030", "#8c8c94", "#282428"],
  mat: ["#c8b48c", "#e0a050", "#a83828", "#381810"],
  player: ["#f8d0a8", "#f8f8f8", "#d04828", "#282020"],
  sysadmin: ["#f8d0a8", "#90d0f8", "#4c7c58", "#202028"],
  floor: ["#a8b0c0", "#98a0b4", "#7880a0", "#282c3c"],
  rack: ["#a8b0c0", "#40e0a0", "#4c5468", "#1c2030"],
  water: ["#a8b0c0", "#c8f0ff", "#4890c8", "#203858"],
  "water-dim": ["#a8b0c0", "#78b8e0", "#4890c8", "#203858"],
  moss: ["#a8b0c0", "#9cb040", "#4c7838", "#203018"],
  sign: ["#f8f0d8", "#c89858", "#8c6034", "#302010"],
  crow: ["#7c7c94", "#ff4040", "#f0a030", "#18181c"],
  rat: ["#b8ff50", "#f0a0a0", "#8c8c94", "#282428"],
  survivor: ["#f8d0a8", "#c8a050", "#6c7c48", "#282020"],
  terminal: ["#d0ffc8", "#48c060", "#707880", "#202428"],
  toaster: ["#f8f8f8", "#f8a040", "#a8a8b8", "#383848"],
  printer: ["#f8f8f8", "#80c0f0", "#c8c8c0", "#404048"],
  vacuum: ["#f8f8f8", "#f0d040", "#d04848", "#402020"],
} as const satisfies Readonly<Record<string, Palette>>;

export type PaletteName = keyof typeof PALETTES;

const [lightest, light, dark, darkest] = PALETTES.ui;

export const UI_PALETTE = { lightest, light, dark, darkest } as const;

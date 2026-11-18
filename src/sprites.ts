import type { CreatureKind } from "#/src/creatures.ts";
import type { GrassFrame } from "#/src/grass.ts";
import { PALETTES, type PaletteName } from "#/src/palette.ts";
import type { Direction } from "#/src/walk-input.ts";
import type { PropKind, TileKind } from "#/src/world.ts";

export type SpriteRows = readonly string[];

export const TILE_PALETTES: Readonly<
  Record<TileKind, readonly [PaletteName, ...PaletteName[]]>
> = {
  ground: ["earth"],
  "cracked-ground": ["earth"],
  "cable-grass": ["grass"],
  obstacle: ["rubble"],
  crater: ["earth"],
  "dead-tree": ["earth"],
  "toxic-pool": ["glow", "glow-dim"],
  barrel: ["barrel", "barrel-dim"],
  debris: ["scrap"],
  wreck: ["earth"],
  "floor-mat": ["mat"],
  floor: ["floor"],
  "server-rack": ["rack"],
  water: ["water", "water-dim"],
  "overgrown-floor": ["moss"],
};

const GRASS_ROOTS: SpriteRows = ["12012012", "21021021", "02102102"];

const GRASS_STILL: SpriteRows = [
  "01001001",
  "21021021",
  "02102102",
  "01201201",
  "10210210",
  ...GRASS_ROOTS,
];

export const GRASS_SPRITES: Readonly<Record<GrassFrame, SpriteRows>> = {
  still: GRASS_STILL,
  leaning: [
    "10100100",
    "12102102",
    "20210210",
    "10120120",
    "01021021",
    ...GRASS_ROOTS,
  ],
  rustling: [
    "10000001",
    "01000010",
    "20100102",
    "02011020",
    "10200201",
    ...GRASS_ROOTS,
  ],
  settling: [
    "00100100",
    "10000001",
    "02000020",
    "01200210",
    "10211201",
    ...GRASS_ROOTS,
  ],
};

const GROUND: SpriteRows = [
  "00000000",
  "00000000",
  "00010000",
  "00000000",
  "00000000",
  "00000010",
  "00000000",
  "00000000",
];

export const TILE_SPRITES: Readonly<Record<TileKind, SpriteRows>> = {
  ground: GROUND,
  "cracked-ground": [
    "00000000",
    "02000000",
    "00200000",
    "00022000",
    "00000200",
    "00000020",
    "00000200",
    "00000000",
  ],
  "cable-grass": GRASS_STILL,
  obstacle: [
    "00333300",
    "03112230",
    "31111223",
    "31112223",
    "32122223",
    "32222233",
    "03322330",
    "00033000",
  ],
  crater: [
    "00111100",
    "01222210",
    "12233221",
    "12333321",
    "12333321",
    "12233221",
    "01222210",
    "00111100",
  ],
  "dead-tree": [
    "03000300",
    "00303030",
    "03033300",
    "00033000",
    "00033000",
    "00033000",
    "00233200",
    "01111110",
  ],
  "toxic-pool": [
    "00333300",
    "03222230",
    "32211223",
    "32111123",
    "32111223",
    "32212223",
    "03222230",
    "00333300",
  ],
  barrel: [
    "03333330",
    "32222223",
    "33333333",
    "32232223",
    "32322323",
    "33333333",
    "32222223",
    "13333331",
  ],
  debris: [
    "00000000",
    "00330000",
    "03213300",
    "32211230",
    "03222213",
    "00322130",
    "00033300",
    "00000000",
  ],
  wreck: GROUND,
  "floor-mat": [
    "00000000",
    "02222220",
    "02111120",
    "02122120",
    "02122120",
    "02111120",
    "02222220",
    "00000000",
  ],
  floor: [
    "00000002",
    "00000002",
    "00100002",
    "00000002",
    "00000102",
    "00000002",
    "00000002",
    "22222222",
  ],
  "server-rack": [
    "33333333",
    "32222223",
    "32131323",
    "32222223",
    "32313123",
    "32222223",
    "32131323",
    "33333333",
  ],
  water: [
    "22222222",
    "22122222",
    "21212222",
    "22222212",
    "22222121",
    "22222222",
    "22122222",
    "22222222",
  ],
  "overgrown-floor": GRASS_STILL,
};

export const PROP_PALETTES: Readonly<Record<PropKind, PaletteName>> = {
  rocket: "rocket",
  "rocket-tail": "rocket",
};

export const PROP_SPRITES: Readonly<Record<PropKind, SpriteRows>> = {
  rocket: [
    ".....33.........................",
    ".....3133.......................",
    ".....311113.....................",
    ".....33333333..333333333333.....",
    ".....300000003..300000000013....",
    "..3333011000003..300330100113...",
    "..32330010003..300032230001113..",
    "..323311110113..311322311011113.",
    "..3233000000003..30033000011113.",
    "..32332222213..322222222221113..",
    "..333322222213..3221122222113...",
    ".....3222222223..32222222213....",
    ".....33333333..333333333333.....",
    ".....311113.....................",
    ".....3133.......................",
    ".....33.........................",
  ],
  "rocket-tail": [
    "......3333......",
    ".....322223.....",
    "....32222223....",
    "....33333333....",
    "3...30000003...3",
    "33..30110003..33",
    "313.30000003.313",
    "3113300000033113",
    "3111300100031113",
    "3333300110033333",
    "....30001003....",
    "..222300003222..",
    ".22222333322222.",
    ".22222222222222.",
    "..222222222222..",
    "....22222222....",
  ],
};

const PLAYER_DOWN_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "30033003",
  ".333333.",
  "..2222..",
  ".222222.",
];

const PLAYER_UP_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "33333333",
  ".333333.",
  "..2222..",
  ".222222.",
];

const PLAYER_LEFT_BODY: SpriteRows = [
  ".333333.",
  "33333333",
  "30333333",
  ".333333.",
  "..2222..",
  "..2222..",
];

const PLAYER_LEGS: readonly SpriteRows[] = [
  [".2.22.2.", ".33..33."],
  ["..2222..", "..3333.."],
];

function withLegs(body: SpriteRows, legs: SpriteRows): SpriteRows {
  return [...body, ...legs];
}

export function mirror(rows: SpriteRows): SpriteRows {
  return rows.map((row) => row.split("").reverse().join(""));
}

function playerFrames(body: SpriteRows): readonly SpriteRows[] {
  return PLAYER_LEGS.map((legs) => withLegs(body, legs));
}

export const PLAYER_SPRITES: Readonly<
  Record<Direction, readonly SpriteRows[]>
> = {
  down: playerFrames(PLAYER_DOWN_BODY),
  up: playerFrames(PLAYER_UP_BODY),
  left: playerFrames(PLAYER_LEFT_BODY),
  right: playerFrames(PLAYER_LEFT_BODY).map(mirror),
};

export function bakeSprite(
  rows: SpriteRows,
  paletteName: PaletteName,
): HTMLCanvasElement {
  const palette = PALETTES[paletteName];
  const canvas = document.createElement("canvas");
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Canvas 2D is not available");
  }
  rows.forEach((row, y) => {
    row.split("").forEach((symbol, x) => {
      const color = palette[Number(symbol)];
      if (color !== undefined) {
        context.fillStyle = color;
        context.fillRect(x, y, 1, 1);
      }
    });
  });
  return canvas;
}

export const CREATURE_SPRITES: Readonly<Record<CreatureKind, SpriteRows>> = {
  crow: [
    "...333..",
    "..31313.",
    "..331322",
    ".303333.",
    "30033333",
    ".333330.",
    "...33...",
    "...2.2..",
  ],
  rat: [
    "........",
    "........",
    "....33..",
    "..330233",
    ".3202213",
    "32222220",
    "3.3333..",
    "1..3.3..",
  ],
  survivor: [
    "..1111..",
    "11111111",
    ".300003.",
    ".303303.",
    "..2222..",
    ".222222.",
    "2.2222.2",
    "..3..3..",
  ],
};

export const SYSADMIN_SPRITE: SpriteRows = [
  "..3333..",
  ".333333.",
  ".310013.",
  ".333333.",
  "..2222..",
  ".222222.",
  "2.2222.2",
  "..3..3..",
];

export const BUBBLE_SPRITE: SpriteRows = [
  "3333333",
  "3000003",
  "3003003",
  "3003003",
  "3000003",
  "3003003",
  "3333333",
  "..3....",
];

export const SIGN_SPRITE: SpriteRows = [
  "33333333",
  "31111113",
  "31333313",
  "31111113",
  "31333113",
  "33333333",
  "...33...",
  "...33...",
];

export const TERMINAL_SPRITE: SpriteRows = [
  ".333333.",
  "32222223",
  "32100123",
  "32010123",
  "32222223",
  ".333333.",
  "..3333..",
  ".333333.",
];

export const TOASTER_SPRITE: SpriteRows = [
  "....33333333....",
  "...3222222223...",
  "..322222222223..",
  "..321100112023..",
  "..321100112023..",
  "..322222222223..",
  "..323333333323..",
  "..323000000323..",
  "..323333333323..",
  "..322222222223..",
  "..333333333333..",
  ".33.3......3.33.",
  "3...3......3...3",
  "....33....33....",
  "....33....33....",
  "...333....333...",
];

export const PRINTER_SPRITE: SpriteRows = [
  "................",
  "....33333333....",
  "....32222223....",
  "....32222223....",
  "..333333333333..",
  ".32222222222223.",
  ".32110011002123.",
  ".32222222222223.",
  ".33333333333333.",
  "..3222222222223.",
  "..3233333333323.",
  "..3232222223323.",
  "..3233333333323.",
  "..333333333333..",
  "................",
  "................",
];

export const VACUUM_SPRITE: SpriteRows = [
  "................",
  "......3333......",
  ".....322223.....",
  "....32100123....",
  "....32100123....",
  "....32222223....",
  "...3322222233...",
  "..332222222233..",
  "..322222222223..",
  "..322333333223..",
  "..322300003223..",
  "..322333333223..",
  "..333333333333..",
  ".33333333333333.",
  "3003003003003003",
  ".33.33.33.33.33.",
];

export const MAINFRAME_SPRITE: SpriteRows = [
  "3333333333333333",
  "3222222222222223",
  "3233333223333323",
  "3231113223111323",
  "3231113223111323",
  "3233333223333323",
  "3222222222222223",
  "3203030303030323",
  "3222222222222223",
  "3233333333333323",
  "3230303030303023",
  "3233333333333323",
  "3222222222222223",
  "3212121212121223",
  "3333333333333333",
  ".33..........33.",
];

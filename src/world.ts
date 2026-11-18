export type TileKind = "ground" | "cable-grass" | "obstacle" | "floor-mat";

export interface TilePosition {
  readonly column: number;
  readonly row: number;
}

export const TILE_SIZE = 8;

const TILE_KIND_BY_SYMBOL: Readonly<Record<string, TileKind>> = {
  ".": "ground",
  "~": "cable-grass",
  "#": "obstacle",
  M: "floor-mat",
};

const MAP_ROWS: readonly string[] = [
  "########################################",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#...~~~~~~~~~~.........................#",
  "#...~~~~~~~~~~.........................#",
  "#...~~~~~~~~~~..####........###........#",
  "#...~~~~~~~~~~..####........###........#",
  "#...~~~~~~~~~~..####........###........#",
  "#...~~~~~~~~~~..............###........#",
  "#...~~~~~~~~~~..............###........#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#.......................##.............#",
  "#.......................##.............#",
  "#...........###.........##......###....#",
  "#...........###.......MM##......###....#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#.........................~~~~~~~~~~...#",
  "#.........................~~~~~~~~~~...#",
  "#.....~~~~~~~~............~~~~~~~~~~...#",
  "#.....~~~~~~~~............~~~~~~~~~~...#",
  "#.....~~~~~~~~............~~~~~~~~~~...#",
  "#.....~~~~~~~~............~~~~~~~~~~...#",
  "#.....~~~~~~~~....######..~~~~~~~~~~...#",
  "#.....~~~~~~~~....######..~~~~~~~~~~...#",
  "#.........................~~~~~~~~~~...#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "#......................................#",
  "########################################",
];

const ROWS: readonly (readonly TileKind[])[] = MAP_ROWS.map((line) =>
  line.split("").map((symbol) => {
    const kind = TILE_KIND_BY_SYMBOL[symbol];
    if (kind === undefined) {
      throw new Error(`Unknown map symbol "${symbol}"`);
    }
    return kind;
  }),
);

export const WORLD_COLUMNS = ROWS[0]?.length ?? 0;

export const WORLD_ROWS = ROWS.length;

export const PLAYER_START: TilePosition = { column: 19, row: 17 };

export const SYSADMIN_TILE: TilePosition = { column: 23, row: 17 };

export function tileAt(column: number, row: number): TileKind {
  return ROWS[row]?.[column] ?? "obstacle";
}

export function isWalkable(kind: TileKind): boolean {
  return kind !== "obstacle";
}

export function isCableGrass(kind: TileKind): boolean {
  return kind === "cable-grass";
}

export const TERMINAL_TILES: readonly TilePosition[] = [
  { column: 6, row: 5 },
  { column: 36, row: 2 },
  { column: 30, row: 26 },
  { column: 4, row: 33 },
  { column: 18, row: 12 },
];

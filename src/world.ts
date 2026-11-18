export type TileKind =
  | "ground"
  | "cracked-ground"
  | "cable-grass"
  | "obstacle"
  | "crater"
  | "dead-tree"
  | "toxic-pool"
  | "barrel"
  | "debris"
  | "wreck"
  | "floor-mat";

export type PropKind = "rocket" | "rocket-tail";

export interface Prop {
  readonly kind: PropKind;
  readonly tile: TilePosition;
  readonly columns: number;
  readonly rows: number;
}

export interface TilePosition {
  readonly column: number;
  readonly row: number;
}

export const TILE_SIZE = 8;

export function isSameTile(a: TilePosition, b: TilePosition): boolean {
  return a.column === b.column && a.row === b.row;
}

const TILE_KIND_BY_SYMBOL: Readonly<Record<string, TileKind>> = {
  ".": "ground",
  ",": "cracked-ground",
  "~": "cable-grass",
  "#": "obstacle",
  o: "crater",
  T: "dead-tree",
  "%": "toxic-pool",
  b: "barrel",
  x: "debris",
  "=": "wreck",
  M: "floor-mat",
};

const MAP_ROWS: readonly string[] = [
  "########################################",
  "###T....,,.....................T......##",
  "#.......,................~~~~~~~~~....##",
  "#...~~~~~...........T...~~~~,~~~~~.....#",
  "#..~~~~~~~..............~~~~~~~~~~.##x.#",
  "#..~~~~~~~............o.~~~~~~~~~~.##..#",
  "#..~~~~~~~..............~~~~~~~~~......#",
  "#..~~~~~~~..x.....x.......~~~~~~.......#",
  "#..~~~~~~.o..====..x................T..#",
  "#...~~~~.....====...........o,,........#",
  "#..........x.....x............,..x.....#",
  "#...........%%.x.%.....................#",
  "#.............o...........~~~~~.....T..#",
  "#.T........o...........x..~~~~~~.......#",
  "#.....x.......,,..........~~~~~~....o..#",
  "#..,,.....T....,...........~~~~~.......#",
  "#...,...........,......................#",
  "##.............##...........###..,,....#",
  "#..............##....MM..,........,.T..#",
  "#.......b.................,............#",
  "#..b.%%.....,..........................#",
  "#...%%%%.....,...T.....~~~~~~~.........#",
  "#....%%.b.............~~~~~~~~........##",
  "#.....................~~~~~~~~........##",
  "#........T............~~~~~~~.b..b.....#",
  "#.............xx..,,...........==.x....#",
  "#....~~~~~~~.......,.........x.==......#",
  "#...~~~~~~~~~......................b...#",
  "#...~~~~~~~~~......o.......x.b.%%......#",
  "#...~~~~~~~~~###.....x..........%......#",
  "#.o.~~~~~~~~~###.........T.............#",
  "#...~~~~~~~~~......................,,..#",
  "#...~~~~~~~~........,,.................#",
  "#..............T.....,....o.........T..#",
  "###...................................##",
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

export const PLAYER_START: TilePosition = { column: 19, row: 18 };

export const SYSADMIN_TILE: TilePosition = { column: 22, row: 18 };

export function tileAt(column: number, row: number): TileKind {
  return ROWS[row]?.[column] ?? "obstacle";
}

const WALKABLE_KINDS: ReadonlySet<TileKind> = new Set([
  "ground",
  "cracked-ground",
  "cable-grass",
  "floor-mat",
]);

export function isWalkable(kind: TileKind): boolean {
  return WALKABLE_KINDS.has(kind);
}

export function isCableGrass(kind: TileKind): boolean {
  return kind === "cable-grass";
}

export const TERMINAL_TILES: readonly TilePosition[] = [
  { column: 6, row: 5 },
  { column: 29, row: 4 },
  { column: 18, row: 9 },
  { column: 8, row: 29 },
  { column: 35, row: 26 },
];

export const PROPS: readonly Prop[] = [
  { kind: "rocket", tile: { column: 13, row: 8 }, columns: 4, rows: 2 },
  { kind: "rocket-tail", tile: { column: 31, row: 25 }, columns: 2, rows: 2 },
];

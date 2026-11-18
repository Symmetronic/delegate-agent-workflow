import { createAudio } from "#/src/audio.ts";
import { ATTACK_CELLS, attackAt, attackLabel } from "#/src/battle-layout.ts";
import { createBattle, type Battle } from "#/src/battle.ts";
import { computeCameraOrigin, type Point } from "#/src/camera.ts";
import { createEncounterTrigger } from "#/src/encounter.ts";
import { GLYPH_ADVANCE, GLYPH_SPRITES, LINE_HEIGHT } from "#/src/font.ts";
import { pickInteraction, type Footprint } from "#/src/interaction.ts";
import type { MachineKind } from "#/src/machines.ts";
import {
  createPlayer,
  isWalkableTile,
  playerPosition,
  walk,
} from "#/src/movement.ts";
import { UI_PALETTE } from "#/src/palette.ts";
import { computeScreenLayout, LOGICAL_SIZE } from "#/src/screen-layout.ts";
import {
  bakeSprite,
  BUBBLE_SPRITE,
  PLAYER_SPRITES,
  PRINTER_SPRITE,
  PROP_PALETTES,
  PROP_SPRITES,
  SYSADMIN_SPRITE,
  TERMINAL_SPRITE,
  TILE_PALETTES,
  TILE_SPRITES,
  TOASTER_SPRITE,
  VACUUM_SPRITE,
  type SpriteRows,
} from "#/src/sprites.ts";
import { createStory } from "#/src/story.ts";
import type { TextPage } from "#/src/text-window.ts";
import { createWalkInput, type Direction } from "#/src/walk-input.ts";
import {
  isSameTile,
  PLAYER_START,
  PROPS,
  SYSADMIN_TILE,
  TERMINAL_TILES,
  TILE_SIZE,
  tileAt,
  WORLD_COLUMNS,
  WORLD_ROWS,
  type PropKind,
  type TileKind,
  type TilePosition,
} from "#/src/world.ts";

const canvas = document.querySelector("canvas");
if (canvas === null) {
  throw new Error("The page has no canvas");
}
const context = canvas.getContext("2d");
if (context === null) {
  throw new Error("Canvas 2D is not available");
}

canvas.width = LOGICAL_SIZE.width;
canvas.height = LOGICAL_SIZE.height;

function bakeTile(kind: TileKind): readonly HTMLCanvasElement[] {
  return TILE_PALETTES[kind].map((palette) =>
    bakeSprite(TILE_SPRITES[kind], palette),
  );
}

function bakePlayer(rows: SpriteRows): HTMLCanvasElement {
  return bakeSprite(rows, "player");
}

const tileImageCache = new Map<TileKind, readonly HTMLCanvasElement[]>();
function tileImages(kind: TileKind): readonly HTMLCanvasElement[] {
  const cached = tileImageCache.get(kind);
  if (cached !== undefined) {
    return cached;
  }
  const baked = bakeTile(kind);
  tileImageCache.set(kind, baked);
  return baked;
}
const propImages: Readonly<Record<PropKind, HTMLCanvasElement>> = {
  rocket: bakeSprite(PROP_SPRITES.rocket, PROP_PALETTES.rocket),
  "rocket-tail": bakeSprite(
    PROP_SPRITES["rocket-tail"],
    PROP_PALETTES["rocket-tail"],
  ),
};
const playerImages: Record<Direction, readonly HTMLCanvasElement[]> = {
  down: PLAYER_SPRITES.down.map(bakePlayer),
  up: PLAYER_SPRITES.up.map(bakePlayer),
  left: PLAYER_SPRITES.left.map(bakePlayer),
  right: PLAYER_SPRITES.right.map(bakePlayer),
};

const glyphImages = new Map(
  Object.entries(GLYPH_SPRITES).map(([character, rows]) => [
    character,
    bakeSprite(rows, "ui"),
  ]),
);
const sysadminImage = bakeSprite(SYSADMIN_SPRITE, "sysadmin");
const bubbleImage = bakeSprite(BUBBLE_SPRITE, "ui");
const terminalImage = bakeSprite(TERMINAL_SPRITE, "terminal");
const machineImages: Readonly<Record<MachineKind, HTMLCanvasElement>> = {
  toaster: bakeSprite(TOASTER_SPRITE, "toaster"),
  printer: bakeSprite(PRINTER_SPRITE, "printer"),
  vacuum: bakeSprite(VACUUM_SPRITE, "vacuum"),
};

const BATTLE_DIRECTION_BY_KEY: Readonly<Record<string, Direction>> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
const MACHINE_LABEL = { x: 6, y: 6 };
const MACHINE_BAR = { x: 6, y: 16 };
const MACHINE_IMAGE = { x: 120, y: 8 };
const PLAYER_LABEL = { x: 90, y: 54 };
const PLAYER_BAR = { x: 90, y: 64 };
const PLAYER_HP_TEXT = { x: 90, y: 72 };
const CELL_BORDER = 1;
const BAR_WIDTH = 50;
const BAR_HEIGHT = 5;
const WINDOW_MARGIN = 4;
const WINDOW_PADDING = 4;
const WINDOW_HEIGHT = 44;
const MORE_MARKER_SIZE = 3;
const BUBBLE_BOB_MILLISECONDS = 350;
const GLOW_MILLISECONDS = 600;
const BUBBLE_HEIGHT = 8;
const TWO_FINGERS = 2;
const HALF = 2;
const BOTH_SIDES = 2;
const BUBBLE_BOB_FRAMES = 2;
const TILE_CENTER_OFFSET = TILE_SIZE / HALF;
const PIXELS_PER_WALK_FRAME = 4;
const MAX_FRAME_MILLISECONDS = 100;
const WORLD_SIZE = {
  width: WORLD_COLUMNS * TILE_SIZE,
  height: WORLD_ROWS * TILE_SIZE,
};

const SYSADMIN_POSITION = {
  x: SYSADMIN_TILE.column * TILE_SIZE,
  y: SYSADMIN_TILE.row * TILE_SIZE,
};

const TERMINAL_POSITIONS = TERMINAL_TILES.map((tile) => ({
  x: tile.column * TILE_SIZE,
  y: tile.row * TILE_SIZE,
}));

const audio = createAudio(() =>
  typeof AudioContext === "undefined" ? null : new AudioContext(),
);
const story = createStory();
const walkInput = createWalkInput();
const encounterTrigger = createEncounterTrigger(Math.random);
let player = createPlayer(PLAYER_START);
let battle: Battle | null = null;
let playerHp: number | null = null;
let lastTile = tileKey();

interface Interactable {
  readonly footprint: Footprint;
  readonly interact: () => void;
}

const INTERACTABLES: readonly Interactable[] = [
  {
    footprint: [SYSADMIN_TILE],
    interact: () => {
      story.talkToSysadmin();
    },
  },
  ...TERMINAL_TILES.map((tile, index) => ({
    footprint: [tile],
    interact: () => {
      story.readTerminal(index);
    },
  })),
];

function isFree(tile: TilePosition): boolean {
  return (
    isWalkableTile(tile) &&
    !INTERACTABLES.some(({ footprint }) =>
      footprint.some((occupied) => isSameTile(occupied, tile)),
    )
  );
}

function tileKey(): string {
  return `${String(player.tile.column)},${String(player.tile.row)}`;
}

function currentTileKind(): TileKind {
  return tileAt(player.tile.column, player.tile.row);
}

function startBattleOnEncounter(): void {
  const key = tileKey();
  if (key === lastTile) {
    return;
  }
  lastTile = key;
  if (encounterTrigger.stepOnto(currentTileKind())) {
    battle = createBattle(
      Math.random,
      playerHp ?? undefined,
      story.hasUltimate(),
    );
    audio.play("encounter");
  }
}

function endBattleWhenFinished(): void {
  if (battle?.phase() !== "finished") {
    return;
  }
  playerHp = battle.playerHp();
  battle = null;
}

function cameraOrigin(): Point {
  const position = playerPosition(player);
  return computeCameraOrigin(
    {
      x: position.x + TILE_CENTER_OFFSET,
      y: position.y + TILE_CENTER_OFFSET,
    },
    LOGICAL_SIZE,
    WORLD_SIZE,
  );
}

function drawText(line: string, x: number, y: number): void {
  if (context === null) {
    return;
  }
  let cursor = x;
  for (const character of line.toUpperCase()) {
    const glyph = glyphImages.get(character);
    if (glyph !== undefined) {
      context.drawImage(glyph, cursor, y);
    }
    cursor += GLYPH_ADVANCE;
  }
}

function drawTextWindow(page: TextPage | null, hasMore: boolean): void {
  if (context === null || page === null) {
    return;
  }
  const width = LOGICAL_SIZE.width - WINDOW_MARGIN * BOTH_SIDES;
  const top = LOGICAL_SIZE.height - WINDOW_MARGIN - WINDOW_HEIGHT;
  context.fillStyle = UI_PALETTE.darkest;
  context.fillRect(WINDOW_MARGIN, top, width, WINDOW_HEIGHT);
  context.fillStyle = UI_PALETTE.lightest;
  context.fillRect(
    WINDOW_MARGIN + 1,
    top + 1,
    width - BOTH_SIDES,
    WINDOW_HEIGHT - BOTH_SIDES,
  );
  page.forEach((line, index) => {
    drawText(
      line,
      WINDOW_MARGIN + WINDOW_PADDING,
      top + WINDOW_PADDING + index * LINE_HEIGHT,
    );
  });
  if (hasMore) {
    context.fillStyle = UI_PALETTE.darkest;
    context.fillRect(
      WINDOW_MARGIN + width - WINDOW_PADDING - MORE_MARKER_SIZE,
      top + WINDOW_HEIGHT - WINDOW_PADDING - MORE_MARKER_SIZE,
      MORE_MARKER_SIZE,
      MORE_MARKER_SIZE,
    );
  }
}

function draw(timestamp: number): void {
  if (context === null) {
    return;
  }
  const camera = cameraOrigin();
  context.fillStyle = UI_PALETTE.lightest;
  context.fillRect(0, 0, LOGICAL_SIZE.width, LOGICAL_SIZE.height);
  const firstColumn = Math.floor(camera.x / TILE_SIZE);
  const lastColumn = Math.ceil((camera.x + LOGICAL_SIZE.width) / TILE_SIZE);
  const firstRow = Math.floor(camera.y / TILE_SIZE);
  const lastRow = Math.ceil((camera.y + LOGICAL_SIZE.height) / TILE_SIZE);
  for (let row = firstRow; row < lastRow; row += 1) {
    for (let column = firstColumn; column < lastColumn; column += 1) {
      const frames = tileImages(tileAt(column, row));
      const image =
        frames[Math.floor(timestamp / GLOW_MILLISECONDS) % frames.length];
      if (image !== undefined) {
        context.drawImage(
          image,
          column * TILE_SIZE - camera.x,
          row * TILE_SIZE - camera.y,
        );
      }
    }
  }
  for (const prop of PROPS) {
    context.drawImage(
      propImages[prop.kind],
      prop.tile.column * TILE_SIZE - camera.x,
      prop.tile.row * TILE_SIZE - camera.y,
    );
  }
  for (const position of TERMINAL_POSITIONS) {
    context.drawImage(
      terminalImage,
      position.x - camera.x,
      position.y - camera.y,
    );
  }
  context.drawImage(
    sysadminImage,
    SYSADMIN_POSITION.x - camera.x,
    SYSADMIN_POSITION.y - camera.y,
  );
  if (story.isBubbleVisible()) {
    const bob =
      Math.floor(timestamp / BUBBLE_BOB_MILLISECONDS) % BUBBLE_BOB_FRAMES;
    context.drawImage(
      bubbleImage,
      SYSADMIN_POSITION.x - camera.x,
      SYSADMIN_POSITION.y - camera.y - BUBBLE_HEIGHT + bob,
    );
  }
  const frames = playerImages[player.facing];
  const frame =
    frames[Math.floor(player.walked / PIXELS_PER_WALK_FRAME) % frames.length];
  if (frame !== undefined) {
    const position = playerPosition(player);
    context.drawImage(
      frame,
      Math.round(position.x) - camera.x,
      Math.round(position.y) - camera.y,
    );
  }
  drawTextWindow(story.page(), story.hasMorePages());
}

function drawBar(x: number, y: number, current: number, max: number): void {
  if (context === null) {
    return;
  }
  context.fillStyle = UI_PALETTE.darkest;
  context.fillRect(x, y, BAR_WIDTH + BOTH_SIDES, BAR_HEIGHT);
  context.fillStyle = UI_PALETTE.lightest;
  context.fillRect(x + 1, y + 1, BAR_WIDTH, BAR_HEIGHT - BOTH_SIDES);
  context.fillStyle = UI_PALETTE.dark;
  context.fillRect(
    x + 1,
    y + 1,
    Math.ceil((BAR_WIDTH * current) / max),
    BAR_HEIGHT - BOTH_SIDES,
  );
}

function drawBattle(active: Battle): void {
  if (context === null) {
    return;
  }
  context.fillStyle = UI_PALETTE.lightest;
  context.fillRect(0, 0, LOGICAL_SIZE.width, LOGICAL_SIZE.height);
  drawText(active.machineName(), MACHINE_LABEL.x, MACHINE_LABEL.y);
  drawBar(
    MACHINE_BAR.x,
    MACHINE_BAR.y,
    active.machineHp(),
    active.machineMaxHp(),
  );
  context.drawImage(
    machineImages[active.machineKind()],
    MACHINE_IMAGE.x,
    MACHINE_IMAGE.y,
  );
  drawText("You", PLAYER_LABEL.x, PLAYER_LABEL.y);
  drawBar(PLAYER_BAR.x, PLAYER_BAR.y, active.playerHp(), active.playerMaxHp());
  drawText(
    `${String(active.playerHp())}/${String(active.playerMaxHp())}`,
    PLAYER_HP_TEXT.x,
    PLAYER_HP_TEXT.y,
  );
  if (active.phase() === "message") {
    drawTextWindow(active.page(), active.hasMorePages());
    return;
  }
  const names = active.attackNames();
  ATTACK_CELLS.forEach((cell, index) => {
    context.fillStyle = UI_PALETTE.darkest;
    context.fillRect(cell.x, cell.y, cell.width, cell.height);
    context.fillStyle =
      index === active.selected() ? UI_PALETTE.light : UI_PALETTE.lightest;
    context.fillRect(
      cell.x + CELL_BORDER,
      cell.y + CELL_BORDER,
      cell.width - CELL_BORDER * BOTH_SIDES,
      cell.height - CELL_BORDER * BOTH_SIDES,
    );
    const label = attackLabel(cell, names[index] ?? "");
    label.lines.forEach((line, lineIndex) => {
      drawText(line, label.x, label.y + lineIndex * LINE_HEIGHT);
    });
  });
}

let previousTimestamp: number | null = null;
function tick(timestamp: number): void {
  const elapsed =
    previousTimestamp === null
      ? 0
      : Math.min(timestamp - previousTimestamp, MAX_FRAME_MILLISECONDS);
  previousTimestamp = timestamp;
  if (battle === null) {
    const stepBefore = Math.floor(player.walked / PIXELS_PER_WALK_FRAME);
    player = walk(
      player,
      story.isOpen() ? null : walkInput.direction(),
      elapsed,
      isFree,
    );
    if (Math.floor(player.walked / PIXELS_PER_WALK_FRAME) !== stepBefore) {
      audio.play("footstep");
    }
    startBattleOnEncounter();
  }
  if (battle === null) {
    draw(timestamp);
  } else {
    drawBattle(battle);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function touchPoint(event: TouchEvent): Point | null {
  const touch = event.touches[0];
  return touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
}

let muteGestureActive = false;
let lastTouchStart: Point = { x: 0, y: 0 };

function toLogical(point: Point): Point | null {
  if (canvas === null) {
    return null;
  }
  const bounds = canvas.getBoundingClientRect();
  return {
    x: ((point.x - bounds.left) * LOGICAL_SIZE.width) / bounds.width,
    y: ((point.y - bounds.top) * LOGICAL_SIZE.height) / bounds.height,
  };
}

function toWorld(point: Point): Point | undefined {
  const logical = toLogical(point);
  if (logical === null) {
    return undefined;
  }
  const camera = cameraOrigin();
  return { x: logical.x + camera.x, y: logical.y + camera.y };
}

function interact(tap?: Point): void {
  const interaction = pickInteraction(
    player,
    INTERACTABLES.map(({ footprint }) => footprint),
    tap,
  );
  if (interaction === null) {
    return;
  }
  player = { ...player, facing: interaction.facing };
  INTERACTABLES[interaction.target]?.interact();
}

function chooseWithSound(active: Battle, choose: () => void): void {
  const wasChoosing = active.phase() === "choosing";
  const before = { machine: active.machineHp(), player: active.playerHp() };
  choose();
  if (!wasChoosing || active.phase() !== "message") {
    return;
  }
  if (active.selfDestructed()) {
    audio.play("self-destruct");
  } else if (
    active.machineHp() < before.machine ||
    active.playerHp() < before.player
  ) {
    audio.play("hit");
  }
}

function handleBattleTap(active: Battle, point: Point): void {
  if (active.phase() === "message") {
    active.advance();
    return;
  }
  const logical = toLogical(point);
  const index = logical === null ? null : attackAt(logical);
  if (index !== null) {
    audio.play("select");
    chooseWithSound(active, () => {
      active.choose(index);
    });
  }
}

function handleTap(point: Point): void {
  if (battle !== null) {
    handleBattleTap(battle, point);
    endBattleWhenFinished();
  } else if (story.isOpen()) {
    story.advance();
  } else {
    const tap = toWorld(point);
    if (tap !== undefined) {
      interact(tap);
    }
  }
}

document.addEventListener("touchstart", (event) => {
  audio.unlock();
  if (event.touches.length === TWO_FINGERS) {
    audio.toggleMute();
    muteGestureActive = true;
    return;
  }
  const point = touchPoint(event);
  if (point !== null && event.touches.length === 1) {
    lastTouchStart = point;
    walkInput.touchStart(point);
  }
});
document.addEventListener("touchmove", (event) => {
  const point = touchPoint(event);
  if (point !== null) {
    walkInput.touchMove(point);
  }
});
function releaseTouch(event: TouchEvent): void {
  if (event.touches.length === 0) {
    const wasMuteGesture = muteGestureActive;
    muteGestureActive = false;
    if (walkInput.touchEnd() === "tap" && !wasMuteGesture) {
      handleTap(lastTouchStart);
    }
  }
}
document.addEventListener("touchend", releaseTouch);
document.addEventListener("touchcancel", releaseTouch);
function handleBattleKey(active: Battle, key: string): void {
  const direction = BATTLE_DIRECTION_BY_KEY[key];
  if (direction !== undefined) {
    const previous = active.selected();
    active.moveSelection(direction);
    if (active.selected() !== previous) {
      audio.play("select");
    }
  } else if (key === "Enter") {
    if (active.phase() === "message") {
      active.advance();
    } else {
      chooseWithSound(active, () => {
        active.confirm();
      });
    }
  }
}

document.addEventListener("keydown", (event) => {
  audio.unlock();
  if (event.key.toLowerCase() === "m" && !event.repeat) {
    audio.toggleMute();
    return;
  }
  if (battle !== null) {
    if (!event.repeat) {
      handleBattleKey(battle, event.key);
      endBattleWhenFinished();
    }
    walkInput.keyDown(event.key);
    return;
  }
  if (event.key === "Enter" && !event.repeat) {
    if (story.isOpen()) {
      story.advance();
    } else {
      interact();
    }
  }
  walkInput.keyDown(event.key);
});
document.addEventListener("keyup", (event) => {
  walkInput.keyUp(event.key);
});

function fitCanvasToViewport(): void {
  const { cssSize } = computeScreenLayout(
    { width: window.innerWidth, height: window.innerHeight },
    window.devicePixelRatio,
  );
  canvas?.style.setProperty("width", `${String(cssSize.width)}px`);
  canvas?.style.setProperty("height", `${String(cssSize.height)}px`);
}

fitCanvasToViewport();
window.addEventListener("resize", fitCanvasToViewport);
window.addEventListener("orientationchange", fitCanvasToViewport);

for (const type of ["contextmenu", "selectstart", "gesturestart"]) {
  document.addEventListener(type, (event) => {
    event.preventDefault();
  });
}
document.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false },
);

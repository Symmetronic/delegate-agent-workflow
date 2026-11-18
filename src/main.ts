import { computeCameraOrigin, type Point } from "#/src/camera.ts";
import { GLYPH_ADVANCE, GLYPH_SPRITES, LINE_HEIGHT } from "#/src/font.ts";
import { createPlayer, walk } from "#/src/movement.ts";
import { PALETTE } from "#/src/palette.ts";
import { computeScreenLayout, LOGICAL_SIZE } from "#/src/screen-layout.ts";
import {
  bakeSprite,
  BUBBLE_SPRITE,
  PLAYER_SPRITES,
  SYSADMIN_SPRITE,
  TERMINAL_SPRITE,
  TILE_SPRITES,
} from "#/src/sprites.ts";
import { createStory } from "#/src/story.ts";
import { createWalkInput, type Direction } from "#/src/walk-input.ts";
import {
  LOG_TILES,
  PLAYER_START,
  SYSADMIN_TILE,
  TILE_SIZE,
  tileAt,
  WORLD_COLUMNS,
  WORLD_ROWS,
  type TileKind,
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

const tileImages: Record<TileKind, HTMLCanvasElement> = {
  ground: bakeSprite(TILE_SPRITES.ground),
  "cable-grass": bakeSprite(TILE_SPRITES["cable-grass"]),
  obstacle: bakeSprite(TILE_SPRITES.obstacle),
  "floor-mat": bakeSprite(TILE_SPRITES["floor-mat"]),
};
const playerImages: Record<Direction, readonly HTMLCanvasElement[]> = {
  down: PLAYER_SPRITES.down.map(bakeSprite),
  up: PLAYER_SPRITES.up.map(bakeSprite),
  left: PLAYER_SPRITES.left.map(bakeSprite),
  right: PLAYER_SPRITES.right.map(bakeSprite),
};

const glyphImages = new Map(
  Object.entries(GLYPH_SPRITES).map(([character, rows]) => [
    character,
    bakeSprite(rows),
  ]),
);
const sysadminImage = bakeSprite(SYSADMIN_SPRITE);
const bubbleImage = bakeSprite(BUBBLE_SPRITE);
const terminalImage = bakeSprite(TERMINAL_SPRITE);

const WINDOW_MARGIN = 4;
const WINDOW_PADDING = 4;
const WINDOW_HEIGHT = 44;
const MORE_MARKER_SIZE = 3;
const BUBBLE_BOB_MILLISECONDS = 350;
const BUBBLE_HEIGHT = 8;
const TAP_RADIUS = 16;
const TALK_DISTANCE = 20;
const PLAYER_CENTER_OFFSET = TILE_SIZE / (1 + 1);
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

const LOG_POSITIONS = LOG_TILES.map((tile) => ({
  x: tile.column * TILE_SIZE,
  y: tile.row * TILE_SIZE,
}));

const story = createStory();
const walkInput = createWalkInput();
let player = createPlayer(PLAYER_START);

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

function drawTextWindow(): void {
  const page = story.page();
  if (context === null || page === null) {
    return;
  }
  const width = LOGICAL_SIZE.width - WINDOW_MARGIN * (1 + 1);
  const top = LOGICAL_SIZE.height - WINDOW_MARGIN - WINDOW_HEIGHT;
  context.fillStyle = PALETTE.darkest;
  context.fillRect(WINDOW_MARGIN, top, width, WINDOW_HEIGHT);
  context.fillStyle = PALETTE.lightest;
  context.fillRect(
    WINDOW_MARGIN + 1,
    top + 1,
    width - (1 + 1),
    WINDOW_HEIGHT - (1 + 1),
  );
  page.forEach((line, index) => {
    drawText(
      line,
      WINDOW_MARGIN + WINDOW_PADDING,
      top + WINDOW_PADDING + index * LINE_HEIGHT,
    );
  });
  if (story.hasMorePages()) {
    context.fillStyle = PALETTE.darkest;
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
  const camera = computeCameraOrigin(
    {
      x: player.x + PLAYER_CENTER_OFFSET,
      y: player.y + PLAYER_CENTER_OFFSET,
    },
    LOGICAL_SIZE,
    WORLD_SIZE,
  );
  context.fillStyle = PALETTE.lightest;
  context.fillRect(0, 0, LOGICAL_SIZE.width, LOGICAL_SIZE.height);
  const firstColumn = Math.floor(camera.x / TILE_SIZE);
  const lastColumn = Math.ceil((camera.x + LOGICAL_SIZE.width) / TILE_SIZE);
  const firstRow = Math.floor(camera.y / TILE_SIZE);
  const lastRow = Math.ceil((camera.y + LOGICAL_SIZE.height) / TILE_SIZE);
  for (let row = firstRow; row < lastRow; row += 1) {
    for (let column = firstColumn; column < lastColumn; column += 1) {
      context.drawImage(
        tileImages[tileAt(column, row)],
        column * TILE_SIZE - camera.x,
        row * TILE_SIZE - camera.y,
      );
    }
  }
  for (const position of LOG_POSITIONS) {
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
    const bob = Math.floor(timestamp / BUBBLE_BOB_MILLISECONDS) % (1 + 1);
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
    context.drawImage(
      frame,
      Math.round(player.x) - camera.x,
      Math.round(player.y) - camera.y,
    );
  }
  drawTextWindow();
}

let previousTimestamp: number | null = null;
function tick(timestamp: number): void {
  const elapsed =
    previousTimestamp === null
      ? 0
      : Math.min(timestamp - previousTimestamp, MAX_FRAME_MILLISECONDS);
  previousTimestamp = timestamp;
  player = walk(player, story.isOpen() ? null : walkInput.direction(), elapsed);
  draw(timestamp);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function touchPoint(event: TouchEvent): Point | null {
  const touch = event.touches[0];
  return touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
}

let lastTouchStart: Point = { x: 0, y: 0 };

function cameraOrigin(): Point {
  return computeCameraOrigin(
    {
      x: player.x + PLAYER_CENTER_OFFSET,
      y: player.y + PLAYER_CENTER_OFFSET,
    },
    LOGICAL_SIZE,
    WORLD_SIZE,
  );
}

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

function isTapOn(point: Point, target: Point): boolean {
  const logical = toLogical(point);
  const camera = cameraOrigin();
  return (
    logical !== null &&
    Math.hypot(
      logical.x - (target.x - camera.x + TILE_SIZE / (1 + 1)),
      logical.y - (target.y - camera.y + TILE_SIZE / (1 + 1)),
    ) <= TAP_RADIUS
  );
}

function isNear(target: Point): boolean {
  return Math.hypot(player.x - target.x, player.y - target.y) <= TALK_DISTANCE;
}

function interact(isTarget: (target: Point) => boolean): void {
  if (isTarget(SYSADMIN_POSITION)) {
    story.talkToSysadmin();
    return;
  }
  const logIndex = LOG_POSITIONS.findIndex(isTarget);
  if (logIndex >= 0) {
    story.readLog(logIndex);
  }
}

function handleTap(point: Point): void {
  if (story.isOpen()) {
    story.advance();
  } else {
    interact((target) => isTapOn(point, target));
  }
}

document.addEventListener("touchstart", (event) => {
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
    if (walkInput.touchEnd() === "tap") {
      handleTap(lastTouchStart);
    }
  }
}
document.addEventListener("touchend", releaseTouch);
document.addEventListener("touchcancel", releaseTouch);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.repeat) {
    if (story.isOpen()) {
      story.advance();
    } else {
      interact(isNear);
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

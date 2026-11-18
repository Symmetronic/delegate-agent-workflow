import { computeCameraOrigin, type Point } from "#/src/camera.ts";
import { createPlayer, walk } from "#/src/movement.ts";
import { PALETTE } from "#/src/palette.ts";
import { computeScreenLayout, LOGICAL_SIZE } from "#/src/screen-layout.ts";
import { bakeSprite, PLAYER_SPRITES, TILE_SPRITES } from "#/src/sprites.ts";
import { createWalkInput, type Direction } from "#/src/walk-input.ts";
import {
  PLAYER_START,
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

const PLAYER_CENTER_OFFSET = TILE_SIZE / (1 + 1);
const PIXELS_PER_WALK_FRAME = 4;
const MAX_FRAME_MILLISECONDS = 100;
const WORLD_SIZE = {
  width: WORLD_COLUMNS * TILE_SIZE,
  height: WORLD_ROWS * TILE_SIZE,
};

const walkInput = createWalkInput();
let player = createPlayer(PLAYER_START);

function draw(): void {
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
}

let previousTimestamp: number | null = null;
function tick(timestamp: number): void {
  const elapsed =
    previousTimestamp === null
      ? 0
      : Math.min(timestamp - previousTimestamp, MAX_FRAME_MILLISECONDS);
  previousTimestamp = timestamp;
  player = walk(player, walkInput.direction(), elapsed);
  draw();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

function touchPoint(event: TouchEvent): Point | null {
  const touch = event.touches[0];
  return touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
}

document.addEventListener("touchstart", (event) => {
  const point = touchPoint(event);
  if (point !== null && event.touches.length === 1) {
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
    walkInput.touchEnd();
  }
}
document.addEventListener("touchend", releaseTouch);
document.addEventListener("touchcancel", releaseTouch);
document.addEventListener("keydown", (event) => {
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

import { computeCameraOrigin } from "#/src/camera.ts";
import { PALETTE } from "#/src/palette.ts";
import { computeScreenLayout, LOGICAL_SIZE } from "#/src/screen-layout.ts";
import { bakeSprite, PLAYER_SPRITE, TILE_SPRITES } from "#/src/sprites.ts";
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
const playerImage = bakeSprite(PLAYER_SPRITE);

const PLAYER_CENTER_OFFSET = TILE_SIZE / (1 + 1);

const player = {
  x: PLAYER_START.column * TILE_SIZE,
  y: PLAYER_START.row * TILE_SIZE,
};
const camera = computeCameraOrigin(
  { x: player.x + PLAYER_CENTER_OFFSET, y: player.y + PLAYER_CENTER_OFFSET },
  LOGICAL_SIZE,
  { width: WORLD_COLUMNS * TILE_SIZE, height: WORLD_ROWS * TILE_SIZE },
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
context.drawImage(playerImage, player.x - camera.x, player.y - camera.y);

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

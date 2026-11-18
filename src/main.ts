import { computeScreenLayout, LOGICAL_SIZE } from "#/src/screen-layout.ts";

const PALETTE = {
  lightest: "#9bbc0f",
  light: "#8bac0f",
  dark: "#306230",
  darkest: "#0f380f",
} as const;

const CHECKER_SIZE = 8;

const CHECKER_PERIOD = 16;

const HALF_PIXEL = 0.5;

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

for (let y = 0; y < LOGICAL_SIZE.height; y += CHECKER_SIZE) {
  for (let x = 0; x < LOGICAL_SIZE.width; x += CHECKER_SIZE) {
    const isEven = (x + y) % CHECKER_PERIOD === 0;
    context.fillStyle = isEven ? PALETTE.lightest : PALETTE.light;
    context.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
  }
}
context.strokeStyle = PALETTE.darkest;
context.lineWidth = 1;
context.strokeRect(
  HALF_PIXEL,
  HALF_PIXEL,
  LOGICAL_SIZE.width - 1,
  LOGICAL_SIZE.height - 1,
);

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

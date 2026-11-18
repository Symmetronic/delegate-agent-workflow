export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface ScreenLayout {
  readonly scale: number;
  readonly cssSize: Size;
}

export const LOGICAL_SIZE: Size = { width: 160, height: 144 };

const MINIMUM_SCALE = 1;

export function computeScreenLayout(
  viewportCssSize: Size,
  devicePixelRatio: number,
): ScreenLayout {
  const scale = Math.max(
    MINIMUM_SCALE,
    Math.floor(
      Math.min(
        (viewportCssSize.width * devicePixelRatio) / LOGICAL_SIZE.width,
        (viewportCssSize.height * devicePixelRatio) / LOGICAL_SIZE.height,
      ),
    ),
  );

  return {
    scale,
    cssSize: {
      width: (LOGICAL_SIZE.width * scale) / devicePixelRatio,
      height: (LOGICAL_SIZE.height * scale) / devicePixelRatio,
    },
  };
}

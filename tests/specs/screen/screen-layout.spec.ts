import { computeScreenLayout } from "#/src/screen-layout.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const PORTRAIT = { width: 390, height: 844 };
const LANDSCAPE = { width: 844, height: 390 };
const PHONE_SCALE = 2;
const PHONE_SIZE = { width: 320, height: 288 };
const DENSITY = 3;
const DENSE_SCALE = 7;
const LOGICAL_WIDTH = 160;
const LOGICAL_HEIGHT = 144;
const MAXIMUM_VIEWPORT = 1200;
const WIDTH_STEP = 37;
const HEIGHT_STEP = 41;
const SWEEP_DENSITY = 2;

describe("screen layout", () => {
  it("scales by the largest integer factor that fits a portrait phone", () => {
    const layout = computeScreenLayout(PORTRAIT, 1);

    assert.equal(layout.scale, PHONE_SCALE);
    assert.deepEqual(layout.cssSize, PHONE_SIZE);
  });

  it("scales by the largest integer factor that fits a landscape phone", () => {
    const layout = computeScreenLayout(LANDSCAPE, 1);

    assert.equal(layout.scale, PHONE_SCALE);
    assert.deepEqual(layout.cssSize, PHONE_SIZE);
  });

  it("scales in device pixels so that high density screens stay crisp", () => {
    const layout = computeScreenLayout(PORTRAIT, DENSITY);

    assert.equal(layout.scale, DENSE_SCALE);
    assert.deepEqual(layout.cssSize, {
      width: (LOGICAL_WIDTH * DENSE_SCALE) / DENSITY,
      height: (LOGICAL_HEIGHT * DENSE_SCALE) / DENSITY,
    });
  });

  it("never overflows the viewport and keeps the aspect ratio", () => {
    for (let width = 160; width <= MAXIMUM_VIEWPORT; width += WIDTH_STEP) {
      for (
        let height = 144;
        height <= MAXIMUM_VIEWPORT;
        height += HEIGHT_STEP
      ) {
        const { cssSize } = computeScreenLayout(
          { width, height },
          SWEEP_DENSITY,
        );

        assert.ok(cssSize.width <= width);
        assert.ok(cssSize.height <= height);
        assert.equal(
          cssSize.width / cssSize.height,
          LOGICAL_WIDTH / LOGICAL_HEIGHT,
        );
      }
    }
  });

  it("falls back to scale one in a viewport smaller than the screen", () => {
    assert.equal(computeScreenLayout({ width: 100, height: 100 }, 1).scale, 1);
  });
});

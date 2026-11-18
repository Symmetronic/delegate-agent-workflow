import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

describe("build", () => {
  it("emits exactly one HTML file and one JavaScript file", async () => {
    const outputDirectory = await mkdtemp(path.join(tmpdir(), "build-"));
    try {
      const result = spawnSync("node", ["scripts/build.ts", outputDirectory], {
        encoding: "utf8",
      });

      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual((await readdir(outputDirectory)).sort(), [
        "game.js",
        "index.html",
      ]);
    } finally {
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});

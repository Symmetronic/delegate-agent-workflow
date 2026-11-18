import { build } from "esbuild";
import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const ARGUMENT_INDEX = 2;

const outputDirectory = path.resolve(process.argv[ARGUMENT_INDEX] ?? "dist");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await build({
  entryPoints: ["src/main.ts"],
  outfile: path.join(outputDirectory, "game.js"),
  bundle: true,
  minify: true,
  target: "es2022",
  format: "iife",
  logLevel: "warning",
});
await copyFile("src/index.html", path.join(outputDirectory, "index.html"));
await cp("src/assets", path.join(outputDirectory, "assets"), {
  recursive: true,
});

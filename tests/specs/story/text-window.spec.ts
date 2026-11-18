import { paginate } from "#/src/text-window.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const COLUMNS = 10;
const LINES = 2;

describe("text window", () => {
  it("wraps text at word boundaries", () => {
    assert.deepEqual(paginate("one two three four", COLUMNS, LINES), [
      ["one two", "three four"],
    ]);
  });

  it("paginates text that exceeds the window", () => {
    const pages = paginate("aaa bbb ccc ddd eee fff", COLUMNS, LINES);

    assert.deepEqual(pages, [["aaa bbb", "ccc ddd"], ["eee fff"]]);
  });

  it("breaks words longer than a line", () => {
    assert.deepEqual(paginate("abcdefghijklm", COLUMNS, LINES), [
      ["abcdefghij", "klm"],
    ]);
  });

  it("returns no page for empty text", () => {
    assert.deepEqual(paginate("  ", COLUMNS, LINES), []);
  });
});

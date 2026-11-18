import { createStory } from "#/src/story.ts";
import {
  createTerminals,
  TOTAL_TERMINALS,
  type TerminalReading,
} from "#/src/terminals.ts";
import {
  isCableGrass,
  isWalkable,
  TERMINAL_TILES,
  tileAt,
} from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const THIRD = 2;
const FOURTH = 3;
const SECOND_READ = 2;
const ALL_TERMINALS = 5;

function textOf(reading: TerminalReading): string {
  return reading.status === "read" ? reading.text : "";
}

describe("terminals", () => {
  it("counts each terminal once and reports the read count", () => {
    const terminals = createTerminals();
    const first = terminals.read(THIRD);

    assert.ok(textOf(first).startsWith("Terminal 1 of 5."));
    assert.equal(terminals.readCount(), 1);
    const second = terminals.read(0);
    assert.ok(
      second.status === "read" && second.text.startsWith("Terminal 2 of 5."),
    );
  });

  it("says an already read terminal is read without counting again", () => {
    const terminals = createTerminals();
    terminals.read(THIRD);
    terminals.read(1);

    assert.deepEqual(terminals.read(1), {
      status: "already-read",
      number: SECOND_READ,
    });
    assert.equal(terminals.readCount(), SECOND_READ);
  });

  it("ignores unknown terminals", () => {
    const terminals = createTerminals();

    assert.equal(terminals.read(TOTAL_TERMINALS).status, "unknown");
    assert.equal(terminals.readCount(), 0);
  });

  it("reads all five terminals", () => {
    const terminals = createTerminals();
    for (let index = 0; index < TOTAL_TERMINALS; index += 1) {
      terminals.read(index);
    }

    assert.equal(TOTAL_TERMINALS, ALL_TERMINALS);
    assert.equal(terminals.readCount(), TOTAL_TERMINALS);
  });

  it("places five terminals on walkable tiles, some in the cable grass", () => {
    assert.equal(TERMINAL_TILES.length, ALL_TERMINALS);
    assert.ok(
      TERMINAL_TILES.every(({ column, row }) =>
        isWalkable(tileAt(column, row)),
      ),
    );
    assert.ok(
      TERMINAL_TILES.some(({ column, row }) =>
        isCableGrass(tileAt(column, row)),
      ),
    );
  });
});

describe("story terminals", () => {
  it("shows the read count and then the already read text", () => {
    const story = createStory();
    while (story.isOpen()) {
      story.advance();
    }
    story.readTerminal(FOURTH);

    assert.match(story.page()?.join(" ") ?? "", /^Terminal 1 of 5\./);
    story.advance();
    while (story.isOpen()) {
      story.advance();
    }
    story.readTerminal(FOURTH);

    assert.equal(story.page()?.join(" "), "Terminal 1 is already read.");
  });

  it("lets the sysadmin report the count", () => {
    const story = createStory();
    while (story.isOpen()) {
      story.advance();
    }
    story.talkToSysadmin();
    while (story.isOpen()) {
      story.advance();
    }
    story.readTerminal(0);
    while (story.isOpen()) {
      story.advance();
    }
    story.talkToSysadmin();

    assert.match(story.page()?.join(" ") ?? "", /Terminals read: 1 of 5/);
  });
});

import { createLogs, TOTAL_LOGS, type LogFinding } from "#/src/logs.ts";
import { createStory } from "#/src/story.ts";
import { isCableGrass, isWalkable, LOG_TILES, tileAt } from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const THIRD = 2;
const FOURTH = 3;
const ALL_LOGS = 5;

function textOf(finding: LogFinding): string {
  return finding.status === "found" ? finding.text : "";
}

describe("logs", () => {
  it("counts each log once and reports the find count", () => {
    const logs = createLogs();
    const first = logs.find(THIRD);

    assert.ok(textOf(first).startsWith("Log 1 of 5."));
    assert.equal(logs.foundCount(), 1);
    const second = logs.find(0);
    assert.ok(
      second.status === "found" && second.text.startsWith("Log 2 of 5."),
    );
  });

  it("says an already found log is found without counting again", () => {
    const logs = createLogs();
    logs.find(1);

    assert.deepEqual(logs.find(1), { status: "already-found", number: 2 });
    assert.equal(logs.foundCount(), 1);
  });

  it("ignores unknown logs", () => {
    const logs = createLogs();

    assert.equal(logs.find(TOTAL_LOGS).status, "unknown");
    assert.equal(logs.foundCount(), 0);
  });

  it("finds all five logs", () => {
    const logs = createLogs();
    for (let index = 0; index < TOTAL_LOGS; index += 1) {
      logs.find(index);
    }

    assert.equal(TOTAL_LOGS, ALL_LOGS);
    assert.equal(logs.foundCount(), TOTAL_LOGS);
  });

  it("places five logs on walkable tiles, some in the cable grass", () => {
    assert.equal(LOG_TILES.length, ALL_LOGS);
    assert.ok(
      LOG_TILES.every(({ column, row }) => isWalkable(tileAt(column, row))),
    );
    assert.ok(
      LOG_TILES.some(({ column, row }) => isCableGrass(tileAt(column, row))),
    );
  });
});

describe("story logs", () => {
  it("shows the find count and then the already found text", () => {
    const story = createStory();
    story.advance();
    story.readLog(FOURTH);

    assert.match(story.page()?.join(" ") ?? "", /^Log 1 of 5\./);
    story.advance();
    while (story.isOpen()) {
      story.advance();
    }
    story.readLog(FOURTH);

    assert.match(story.page()?.join(" ") ?? "", /already found/);
  });

  it("lets the sysadmin report the count", () => {
    const story = createStory();
    story.advance();
    story.talkToSysadmin();
    while (story.isOpen()) {
      story.advance();
    }
    story.readLog(0);
    while (story.isOpen()) {
      story.advance();
    }
    story.talkToSysadmin();

    assert.match(story.page()?.join(" ") ?? "", /Logs found: 1 of 5/);
  });
});

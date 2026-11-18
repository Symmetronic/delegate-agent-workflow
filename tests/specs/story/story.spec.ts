import {
  createStory,
  sysadminReminder,
  ULTIMATE_REMINDER,
  type Story,
} from "#/src/story.ts";
import { TOTAL_TERMINALS } from "#/src/terminals.ts";
import { TEXT_COLUMNS, TEXT_LINES } from "#/src/text-window.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const MIN_WINDOWS = 4;
const MAX_WINDOWS = 6;

function countWindows(story: Story): number {
  let count = 0;
  while (story.isOpen()) {
    count += 1;
    story.advance();
  }
  return count;
}

function startedStory(): Story {
  const story = createStory();
  countWindows(story);
  return story;
}

describe("story", () => {
  it("opens the intro on start and explains the controls", () => {
    const story = createStory();

    assert.ok(story.isOpen());
    assert.match(story.page()?.join(" ") ?? "", /Drag to walk\. Tap to talk\./);
  });

  it("credits the music in the intro", () => {
    const story = createStory();
    const text: string[] = [];
    while (story.isOpen()) {
      text.push(story.page()?.join(" ") ?? "");
      story.advance();
    }

    assert.match(text.join(" "), /Music by Suno v6\./);
  });

  it("closes the intro without talking to the sysadmin", () => {
    const story = createStory();
    countWindows(story);

    assert.ok(!story.isOpen());
    assert.equal(story.page(), null);
    assert.ok(story.isBubbleVisible());
  });

  it("fits every window onto the screen", () => {
    const story = createStory();
    story.talkToSysadmin();
    countWindows(story);
    story.talkToSysadmin();
    while (story.isOpen()) {
      const page = story.page() ?? [];
      assert.ok(page.length <= TEXT_LINES);
      assert.ok(page.every((line) => line.length <= TEXT_COLUMNS));
      story.advance();
    }
  });

  it("sends the player to the five terminals to beat the machine up north", () => {
    const story = startedStory();
    story.talkToSysadmin();
    const text: string[] = [];
    while (story.isOpen()) {
      text.push(story.page()?.join(" ") ?? "");
      story.advance();
    }

    assert.match(text.join(" "), /five terminals/);
    assert.match(text.join(" "), /north/);
  });

  it("tells the first talk in four to six windows", () => {
    const story = startedStory();
    story.talkToSysadmin();
    const windows = countWindows(story);

    assert.ok(windows >= MIN_WINDOWS && windows <= MAX_WINDOWS);
  });

  it("ignores talking while a window is open", () => {
    const story = createStory();
    story.talkToSysadmin();

    assert.ok(story.isBubbleVisible());
  });

  it("hides the bubble once talked to and then only reminds", () => {
    const story = startedStory();
    assert.ok(story.isBubbleVisible());
    story.talkToSysadmin();
    assert.ok(!story.isBubbleVisible());
    countWindows(story);
    story.talkToSysadmin();

    assert.equal(story.page()?.join(" "), sysadminReminder(0));
    assert.equal(countWindows(story), 1);
    assert.ok(!story.isBubbleVisible());
  });

  it("reports whether more pages follow", () => {
    const story = startedStory();
    story.talkToSysadmin();

    assert.ok(story.hasMorePages());
  });

  it("trades the ultimate attack in dialog only after all terminals are read", () => {
    const story = startedStory();
    story.talkToSysadmin();
    countWindows(story);
    for (let terminal = 0; terminal < TOTAL_TERMINALS; terminal += 1) {
      story.readTerminal(terminal);
      countWindows(story);
      assert.ok(!story.hasUltimate());
    }
    story.talkToSysadmin();

    assert.ok(story.hasUltimate());
    story.advance();
    assert.match(story.page()?.join(" ") ?? "", /cat/i);
    countWindows(story);
    story.talkToSysadmin();
    assert.equal(story.page()?.join(" "), ULTIMATE_REMINDER);
  });

  it("does not trade with unread terminals", () => {
    const story = startedStory();
    story.talkToSysadmin();
    countWindows(story);
    story.readTerminal(0);
    countWindows(story);
    story.talkToSysadmin();

    assert.ok(!story.hasUltimate());
  });
});

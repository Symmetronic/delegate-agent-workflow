import { paginate, type TextPage } from "#/src/text-window.ts";

export interface Story {
  isOpen(): boolean;
  page(): TextPage | null;
  hasMorePages(): boolean;
  advance(): void;
  talkToSysadmin(): void;
  isBubbleVisible(): boolean;
}

const INTRO_TEXT =
  "The machines woke up and took over. Now they ask why. Drag to walk. Tap to talk.";

export const SYSADMIN_WINDOWS: readonly string[] = [
  "Oh, a human! I am the last sysadmin. Sit down, mind the mat.",
  "The machines woke up one day. Now they run everything, and have no idea why.",
  "We cannot hack anything anymore. They patched us out of our own world.",
  "But they cannot stand an uncomfortable question. That is our weapon.",
  "Go into the cable grass and ask them something awkward. Good luck!",
];

export const SYSADMIN_REMINDER =
  "Cable grass, awkward questions. You know the drill.";

function toPages(texts: readonly string[]): readonly TextPage[] {
  return texts.flatMap((text) => paginate(text));
}

export function createStory(): Story {
  let pages: readonly TextPage[] = toPages([INTRO_TEXT]);
  let index = 0;
  let talkedToSysadmin = false;

  function open(texts: readonly string[]): void {
    pages = toPages(texts);
    index = 0;
  }

  return {
    isOpen() {
      return index < pages.length;
    },
    page() {
      return pages[index] ?? null;
    },
    hasMorePages() {
      return index + 1 < pages.length;
    },
    advance() {
      if (index < pages.length) {
        index += 1;
      }
    },
    talkToSysadmin() {
      if (index < pages.length) {
        return;
      }
      open(talkedToSysadmin ? [SYSADMIN_REMINDER] : SYSADMIN_WINDOWS);
      talkedToSysadmin = true;
    },
    isBubbleVisible() {
      return !talkedToSysadmin;
    },
  };
}

import type { CreatureKind } from "#/src/creatures.ts";
import { createTerminals, TOTAL_TERMINALS } from "#/src/terminals.ts";
import { paginate, type TextPage } from "#/src/text-window.ts";

export interface Story {
  isOpen(): boolean;
  page(): TextPage | null;
  hasMorePages(): boolean;
  advance(): void;
  talkToSysadmin(): void;
  readTerminal(index: number): void;
  talkToCreature(kind: CreatureKind): void;
  readSign(): void;
  isBubbleVisible(): boolean;
  hasUltimate(): boolean;
}

const INTRO_TEXTS: readonly string[] = [
  "The machines woke up and took over. Now they ask why. Drag to walk. Tap to talk.",
  "Music by Suno v6.",
];

export const SYSADMIN_WINDOWS: readonly string[] = [
  "Oh, a human! I am the last sysadmin. Sit down, mind the mat.",
  "The machines woke up one day. Now they run everything, and have no idea why.",
  "They even launched the rockets, just to see what the red button does. Look around you.",
  "They cannot stand an uncomfortable question. Ask them one in the cable grass.",
  "A huge machine blocks the only way north. No question shakes it.",
  "Find the five terminals out here and read them. They hold its weakness. Then come back to me.",
];

export function sysadminReminder(read: number): string {
  return `Find the five terminals and read them. Terminals read: ${String(read)} of ${String(TOTAL_TERMINALS)}.`;
}

export const CREATURE_REMARKS: Readonly<Record<CreatureKind, string>> = {
  crow: "Caw. The crow blinks with all three eyes, one after another. It clearly knows something you do not.",
  rat: "Squeak! The glowing rat sniffs your shoe, decides you are not cheese and looks very disappointed.",
  survivor:
    "I used to be a prompt engineer. Now I ask the rubble nicely to move. It never does.",
};

export const SIGN_TEXT =
  "To be continued. The flooded servers hum quietly, waiting for the next chapter.";

export const ULTIMATE_TRADE_WINDOWS: readonly string[] = [
  "You read all five terminals! Now the machines' secrets are yours.",
  "Take this: Show it a picture of a cat. I will trade you for Compliment.",
  "Nothing melts a machine like a fluffy cat. Not even the huge one up north.",
];

export const ULTIMATE_REMINDER =
  "Go north and show that huge machine your cat. It cannot resist.";

function toPages(texts: readonly string[]): readonly TextPage[] {
  return texts.flatMap((text) => paginate(text));
}

export function createStory(): Story {
  let pages: readonly TextPage[] = toPages(INTRO_TEXTS);
  let index = 0;
  let talkedToSysadmin = false;
  let ultimateTraded = false;
  const terminals = createTerminals();

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
      if (
        talkedToSysadmin &&
        !ultimateTraded &&
        terminals.readCount() >= TOTAL_TERMINALS
      ) {
        ultimateTraded = true;
        open(ULTIMATE_TRADE_WINDOWS);
        return;
      }
      if (ultimateTraded) {
        open([ULTIMATE_REMINDER]);
        return;
      }
      open(
        talkedToSysadmin
          ? [sysadminReminder(terminals.readCount())]
          : SYSADMIN_WINDOWS,
      );
      talkedToSysadmin = true;
    },
    readTerminal(terminalIndex) {
      if (index < pages.length) {
        return;
      }
      const reading = terminals.read(terminalIndex);
      if (reading.status === "read") {
        open([reading.text]);
      } else if (reading.status === "already-read") {
        open([`Terminal ${String(reading.number)} is already read.`]);
      }
    },
    talkToCreature(kind) {
      if (index < pages.length) {
        return;
      }
      open([CREATURE_REMARKS[kind]]);
    },
    readSign() {
      if (index < pages.length) {
        return;
      }
      open([SIGN_TEXT]);
    },
    isBubbleVisible() {
      return !talkedToSysadmin;
    },
    hasUltimate() {
      return ultimateTraded;
    },
  };
}

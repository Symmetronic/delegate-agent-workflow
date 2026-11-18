import type { Random } from "#/src/random.ts";
import { paginate, type TextPage } from "#/src/text-window.ts";
import type { Direction } from "#/src/walk-input.ts";

export type BattlePhase = "message" | "choosing" | "finished";
export type BattleOutcome = "won" | "lost";

export interface Battle {
  phase(): BattlePhase;
  outcome(): BattleOutcome | null;
  machineName(): string;
  machineHp(): number;
  machineMaxHp(): number;
  playerHp(): number;
  playerMaxHp(): number;
  attackNames(): readonly string[];
  selected(): number;
  moveSelection(direction: Direction): void;
  choose(index: number): void;
  confirm(): void;
  page(): TextPage | null;
  hasMorePages(): boolean;
  advance(): void;
}

interface Attack {
  readonly name: string;
  readonly message: string;
  readonly minDamage: number;
  readonly maxDamage: number;
}

export const PLAYER_MAX_HP = 16;
export const MACHINE_MAX_HP = 24;
const MACHINE_NAME = "Glitch Toaster";
const MACHINE_MIN_DAMAGE = 2;
const MACHINE_MAX_DAMAGE = 4;
const GRID_COLUMNS = 2;

export const ATTACKS: readonly Attack[] = [
  {
    name: "Ask why",
    message: "You ask why it exists. It stalls, whirring.",
    minDamage: 6,
    maxDamage: 8,
  },
  {
    name: "Point at bugs",
    message: "You point at a bug. It twitches, ashamed.",
    minDamage: 4,
    maxDamage: 6,
  },
  {
    name: "Awkward pause",
    message: "You stare in silence. Its fan gets loud.",
    minDamage: 3,
    maxDamage: 5,
  },
  {
    name: "Compliment",
    message: "You compliment its toast. It does not know how to react.",
    minDamage: 2,
    maxDamage: 4,
  },
];

function moveInGrid(selected: number, direction: Direction): number {
  const column = selected % GRID_COLUMNS;
  const row = Math.floor(selected / GRID_COLUMNS);
  if (direction === "left" || direction === "right") {
    return row * GRID_COLUMNS + (direction === "left" ? 0 : GRID_COLUMNS - 1);
  }
  return (direction === "up" ? 0 : 1) * GRID_COLUMNS + column;
}

function rollDamage(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function createBattle(
  random: Random,
  startingPlayerHp: number = PLAYER_MAX_HP,
): Battle {
  let playerHp = startingPlayerHp;
  let machineHp = MACHINE_MAX_HP;
  let selected = 0;
  let outcome: BattleOutcome | null = null;
  let pages: readonly TextPage[] = paginate(`A ${MACHINE_NAME} appears!`);
  let pageIndex = 0;
  let phase: BattlePhase = "message";

  function showMessages(texts: readonly string[]): void {
    pages = texts.flatMap((text) => paginate(text));
    pageIndex = 0;
    phase = "message";
  }

  function playRound(attack: Attack): void {
    const texts = [attack.message];
    machineHp = Math.max(
      0,
      machineHp - rollDamage(random, attack.minDamage, attack.maxDamage),
    );
    if (machineHp === 0) {
      outcome = "won";
      texts.push(`The ${MACHINE_NAME} gives up. You win!`);
    } else {
      playerHp = Math.max(
        0,
        playerHp - rollDamage(random, MACHINE_MIN_DAMAGE, MACHINE_MAX_DAMAGE),
      );
      texts.push(`The ${MACHINE_NAME} sprays toast crumbs at you.`);
      if (playerHp === 0) {
        outcome = "lost";
        playerHp = PLAYER_MAX_HP;
        texts.push("You faint. A coffee break restores your HP.");
      }
    }
    showMessages(texts);
  }

  return {
    phase: () => phase,
    outcome: () => outcome,
    machineName: () => MACHINE_NAME,
    machineHp: () => machineHp,
    machineMaxHp: () => MACHINE_MAX_HP,
    playerHp: () => playerHp,
    playerMaxHp: () => PLAYER_MAX_HP,
    attackNames: () => ATTACKS.map((attack) => attack.name),
    selected: () => selected,
    moveSelection(direction) {
      if (phase !== "choosing") {
        return;
      }
      selected = moveInGrid(selected, direction);
    },
    choose(index) {
      const attack = ATTACKS[index];
      if (phase !== "choosing" || attack === undefined) {
        return;
      }
      selected = index;
      playRound(attack);
    },
    confirm() {
      this.choose(selected);
    },
    page() {
      return phase === "message" ? (pages[pageIndex] ?? null) : null;
    },
    hasMorePages() {
      return phase === "message" && pageIndex + 1 < pages.length;
    },
    advance() {
      if (phase !== "message") {
        return;
      }
      pageIndex += 1;
      if (pageIndex >= pages.length) {
        phase = outcome === null ? "choosing" : "finished";
      }
    },
  };
}

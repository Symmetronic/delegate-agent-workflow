import { MACHINES, type Machine, type MachineKind } from "#/src/machines.ts";
import type { Random } from "#/src/random.ts";
import { paginate, type TextPage } from "#/src/text-window.ts";
import type { Direction } from "#/src/walk-input.ts";

export type BattlePhase = "message" | "choosing" | "finished";
export type BattleOutcome = "won" | "lost";

export interface Battle {
  phase(): BattlePhase;
  outcome(): BattleOutcome | null;
  selfDestructed(): boolean;
  machineKind(): MachineKind;
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
  readonly maxSelfDestructChance: number;
  readonly healsPlayer: number;
  readonly stunsMachine: boolean;
  readonly winMessages?: readonly string[];
}

export const PLAYER_MAX_HP = 16;
const GRID_COLUMNS = 2;

export const ATTACKS: readonly Attack[] = [
  {
    name: "Ask why",
    message: "You ask why it exists. It stalls, whirring.",
    minDamage: 6,
    maxDamage: 8,
    maxSelfDestructChance: 0.6,
    healsPlayer: 0,
    stunsMachine: false,
  },
  {
    name: "Point at bugs",
    message: "You point at a bug. It twitches, ashamed.",
    minDamage: 4,
    maxDamage: 6,
    maxSelfDestructChance: 0.3,
    healsPlayer: 0,
    stunsMachine: false,
  },
  {
    name: "Awkward pause",
    message: "You stare in silence. It freezes and forgets to strike back.",
    minDamage: 3,
    maxDamage: 5,
    maxSelfDestructChance: 0.2,
    healsPlayer: 0,
    stunsMachine: true,
  },
  {
    name: "Compliment",
    message: "You compliment it. It does not know how to react. You feel good.",
    minDamage: 2,
    maxDamage: 4,
    maxSelfDestructChance: 0.1,
    healsPlayer: 3,
    stunsMachine: false,
  },
];

export const ULTIMATE_ATTACK: Attack = {
  name: "Show it a picture of a cat",
  message: "You show it a picture of a cat. It stares. Its fans stop.",
  minDamage: 99,
  maxDamage: 99,
  maxSelfDestructChance: 0,
  healsPlayer: 0,
  stunsMachine: false,
  winMessages: ["It whispers: so soft. So fluffy. What was I doing again?"],
};

const WEAKEST_ATTACK_INDEX = ATTACKS.reduce(
  (weakest, attack, index) =>
    attack.maxDamage < (ATTACKS[weakest]?.maxDamage ?? Infinity)
      ? index
      : weakest,
  0,
);

export function attacksFor(hasUltimate: boolean): readonly Attack[] {
  return hasUltimate
    ? ATTACKS.map((attack, index) =>
        index === WEAKEST_ATTACK_INDEX ? ULTIMATE_ATTACK : attack,
      )
    : ATTACKS;
}

export function selfDestructChance(
  attackIndex: number,
  machineHp: number,
  machineMaxHp: number,
  hasUltimate = false,
): number {
  const attack = attacksFor(hasUltimate)[attackIndex];
  if (attack === undefined || machineMaxHp <= 0) {
    return 0;
  }
  const lostShare = 1 - Math.min(machineHp, machineMaxHp) / machineMaxHp;
  return attack.maxSelfDestructChance * lostShare;
}

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

function drawMachine(random: Random): Machine {
  return MACHINES[Math.floor(random() * MACHINES.length)] ?? MACHINES[0];
}

export function createBattle(
  random: Random,
  startingPlayerHp: number = PLAYER_MAX_HP,
  hasUltimate = false,
): Battle {
  const attacks = attacksFor(hasUltimate);
  const machine = drawMachine(random);
  let playerHp = startingPlayerHp;
  let machineHp = machine.maxHp;
  let selected = 0;
  let outcome: BattleOutcome | null = null;
  let selfDestructed = false;
  let pages: readonly TextPage[] = paginate(`A ${machine.name} appears!`);
  let pageIndex = 0;
  let phase: BattlePhase = "message";

  function showMessages(texts: readonly string[]): void {
    pages = texts.flatMap((text) => paginate(text));
    pageIndex = 0;
    phase = "message";
  }

  function playRound(attackIndex: number, attack: Attack): void {
    const texts = [attack.message];
    machineHp = Math.max(
      0,
      machineHp - rollDamage(random, attack.minDamage, attack.maxDamage),
    );
    playerHp = Math.min(PLAYER_MAX_HP, playerHp + attack.healsPlayer);
    if (machineHp === 0) {
      outcome = "won";
      texts.push(
        ...(attack.winMessages ?? [`The ${machine.name} gives up.`]),
        machine.conversion,
      );
    } else if (
      random() <
      selfDestructChance(attackIndex, machineHp, machine.maxHp, hasUltimate)
    ) {
      machineHp = 0;
      selfDestructed = true;
      outcome = "won";
      texts.push(...machine.selfDestruct, machine.conversion);
    } else if (!attack.stunsMachine) {
      playerHp = Math.max(
        0,
        playerHp - rollDamage(random, machine.minDamage, machine.maxDamage),
      );
      texts.push(machine.counterAttack);
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
    selfDestructed: () => selfDestructed,
    machineKind: () => machine.kind,
    machineName: () => machine.name,
    machineHp: () => machineHp,
    machineMaxHp: () => machine.maxHp,
    playerHp: () => playerHp,
    playerMaxHp: () => PLAYER_MAX_HP,
    attackNames: () => attacks.map((attack) => attack.name),
    selected: () => selected,
    moveSelection(direction) {
      if (phase !== "choosing") {
        return;
      }
      selected = moveInGrid(selected, direction);
    },
    choose(index) {
      const attack = attacks[index];
      if (phase !== "choosing" || attack === undefined) {
        return;
      }
      selected = index;
      playRound(index, attack);
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

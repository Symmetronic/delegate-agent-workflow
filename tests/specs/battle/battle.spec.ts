import { ATTACK_CELLS, attackAt, attackLabel } from "#/src/battle-layout.ts";
import {
  ATTACKS,
  attacksFor,
  createBattle,
  PLAYER_MAX_HP,
  selfDestructChance,
  ULTIMATE_ATTACK,
  type Battle,
} from "#/src/battle.ts";
import { createEncounterTrigger } from "#/src/encounter.ts";
import { GLYPH_ADVANCE, LINE_HEIGHT } from "#/src/font.ts";
import { MACHINES } from "#/src/machines.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ATTACK_COUNT = 4;
const LAST_ATTACK = 3;
const MAX_ROLL = 0.999;
const MAX_ROUNDS = 100;
const ENCOUNTER_CHANCE = 0.25;
const FIRST_MACHINE_ROLL = 0;
const SECOND_MACHINE_ROLL = 0.4;
const THIRD_MACHINE_ROLL = 0.9;
const NEVER_SELF_DESTRUCT_ROLL = 0.999;
const LOW_HP_SHARE = 0.1;
const HALF = 0.5;
const SEQUENCE_LENGTH = 3;
const LOW_PLAYER_HP = 5;
const EXISTENTIAL_QUESTION = 0;
const AWKWARD_PAUSE = 2;
const COMPLIMENT = 3;

function scripted(rolls: readonly number[], fallback: number): () => number {
  let index = 0;
  return () => {
    const roll = rolls[index] ?? fallback;
    index += 1;
    return roll;
  };
}

function pages(battle: Battle): string[] {
  const texts: string[] = [];
  while (battle.phase() === "message") {
    const page = battle.page();
    if (page !== null) {
      texts.push(page.join(" "));
    }
    battle.advance();
  }
  return texts;
}

function skipMessages(battle: Battle): void {
  while (battle.phase() === "message") {
    battle.advance();
  }
}

function startChoosing(random: () => number, hp?: number): Battle {
  const battle = createBattle(random, hp);
  skipMessages(battle);
  return battle;
}

describe("encounter trigger", () => {
  it("triggers in cable grass only when the roll is below the chance", () => {
    assert.equal(
      createEncounterTrigger(() => 0, ENCOUNTER_CHANCE).stepOnto("cable-grass"),
      true,
    );
    assert.equal(
      createEncounterTrigger(() => MAX_ROLL, ENCOUNTER_CHANCE).stepOnto(
        "cable-grass",
      ),
      false,
    );
  });

  it("never triggers on normal ground", () => {
    const trigger = createEncounterTrigger(() => 0, 1);
    for (const kind of ["ground", "obstacle", "floor-mat"] as const) {
      assert.equal(trigger.stepOnto(kind), false);
    }
  });
});

describe("battle", () => {
  it("starts with an announcement and then lets the player choose", () => {
    const battle = createBattle(() => 0);

    assert.equal(battle.phase(), "message");
    assert.notEqual(battle.page(), null);
    skipMessages(battle);
    assert.equal(battle.phase(), "choosing");
    assert.equal(battle.attackNames().length, ATTACK_COUNT);
  });

  it("draws each of the three machine types from the random roll", () => {
    const kinds = [FIRST_MACHINE_ROLL, SECOND_MACHINE_ROLL, THIRD_MACHINE_ROLL]
      .map((roll) => createBattle(() => roll))
      .map((battle) => battle.machineKind());

    assert.deepEqual(
      kinds,
      MACHINES.map((machine) => machine.kind),
    );
    assert.equal(new Set(kinds).size, MACHINES.length);
  });

  it("gives every machine type its own HP and counter-attack line", () => {
    assert.equal(new Set(MACHINES.map((m) => m.maxHp)).size, MACHINES.length);
    assert.equal(
      new Set(MACHINES.map((m) => m.counterAttack)).size,
      MACHINES.length,
    );
    for (const [index, roll] of [
      FIRST_MACHINE_ROLL,
      SECOND_MACHINE_ROLL,
      THIRD_MACHINE_ROLL,
    ].entries()) {
      const battle = startChoosing(scripted([roll], NEVER_SELF_DESTRUCT_ROLL));
      assert.equal(battle.machineMaxHp(), MACHINES[index]?.maxHp);
      battle.choose(COMPLIMENT);
      assert.ok(
        pages(battle).includes(MACHINES[index]?.counterAttack ?? "missing"),
      );
    }
  });

  it("resolves a round with both strikes and returns to selection", () => {
    const battle = startChoosing(scripted([], NEVER_SELF_DESTRUCT_ROLL));
    const maxHp = battle.machineMaxHp();

    battle.choose(1);

    assert.equal(battle.phase(), "message");
    assert.ok(battle.machineHp() < maxHp);
    assert.ok(battle.playerHp() < PLAYER_MAX_HP);
    skipMessages(battle);
    assert.equal(battle.phase(), "choosing");
    assert.equal(battle.outcome(), null);
  });

  it("gives each attack its own message and effect", () => {
    const messages = new Set<string>();
    for (let index = 0; index < ATTACK_COUNT; index += 1) {
      const battle = startChoosing(
        scripted([FIRST_MACHINE_ROLL], NEVER_SELF_DESTRUCT_ROLL),
      );
      battle.choose(index);
      messages.add(battle.page()?.join(" ") ?? "");
    }
    assert.equal(messages.size, ATTACK_COUNT);
  });

  it("lets the awkward pause stop the counter-attack", () => {
    const battle = startChoosing(scripted([], NEVER_SELF_DESTRUCT_ROLL));

    battle.choose(AWKWARD_PAUSE);

    assert.equal(battle.playerHp(), PLAYER_MAX_HP);
  });

  it("lets the compliment heal the player", () => {
    const battle = startChoosing(
      scripted([0, 0, NEVER_SELF_DESTRUCT_ROLL, 0], 0),
      LOW_PLAYER_HP,
    );

    battle.choose(COMPLIMENT);

    assert.ok(battle.playerHp() > LOW_PLAYER_HP);
    assert.ok(battle.machineHp() < battle.machineMaxHp());
  });

  it("ignores choices while a message is shown", () => {
    const battle = createBattle(() => 0);

    battle.choose(0);

    assert.equal(battle.machineHp(), battle.machineMaxHp());
  });

  it("moves the selection through the two-by-two grid", () => {
    const battle = startChoosing(() => 0);

    battle.moveSelection("right");
    assert.equal(battle.selected(), 1);
    battle.moveSelection("down");
    assert.equal(battle.selected(), LAST_ATTACK);
    battle.moveSelection("left");
    assert.equal(battle.selected(), ATTACK_COUNT / (1 + 1));
    battle.moveSelection("up");
    assert.equal(battle.selected(), 0);
    battle.moveSelection("up");
    assert.equal(battle.selected(), 0);
  });

  it("confirms the selected attack", () => {
    const battle = startChoosing(scripted([], NEVER_SELF_DESTRUCT_ROLL));
    battle.moveSelection("down");

    battle.confirm();

    assert.equal(battle.phase(), "message");
    assert.ok(battle.machineHp() < battle.machineMaxHp());
  });

  it("is won once the machine has no HP left and converts it", () => {
    const battle = startChoosing(() => MAX_ROLL);
    const texts: string[] = [];
    for (
      let round = 0;
      round < MAX_ROUNDS && battle.phase() !== "finished";
      round += 1
    ) {
      if (battle.phase() === "choosing") {
        battle.choose(EXISTENTIAL_QUESTION);
      }
      texts.push(...pages(battle));
    }

    assert.equal(battle.phase(), "finished");
    assert.equal(battle.outcome(), "won");
    assert.equal(battle.machineHp(), 0);
    assert.ok(texts.some((text) => text.includes("reboots as a Friendly")));
  });

  it("self-destructs with its own text sequence when the roll is low", () => {
    const battle = startChoosing(scripted([FIRST_MACHINE_ROLL], 0));
    const full = battle.machineMaxHp();

    battle.choose(EXISTENTIAL_QUESTION);
    const texts = pages(battle);

    assert.equal(battle.outcome(), "won");
    assert.equal(battle.phase(), "finished");
    assert.equal(battle.machineHp(), 0);
    assert.ok(full > 0);
    assert.ok(texts.some((text) => text.includes("Self-destruct")));
    assert.ok(texts.length >= SEQUENCE_LENGTH);
  });

  it("is lost as a coffee break that restores full HP", () => {
    const battle = startChoosing(scripted([], NEVER_SELF_DESTRUCT_ROLL), 1);

    battle.choose(LAST_ATTACK);
    assert.equal(battle.outcome(), "lost");
    assert.equal(battle.playerHp(), PLAYER_MAX_HP);
    skipMessages(battle);
    assert.equal(battle.phase(), "finished");
  });

  it("always ends every round in selection or in a finish", () => {
    for (const roll of [0, HALF, MAX_ROLL]) {
      const battle = startChoosing(() => roll);
      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        if (battle.phase() === "finished") {
          break;
        }
        if (battle.phase() === "choosing") {
          battle.choose(round % ATTACK_COUNT);
        }
        skipMessages(battle);
        assert.ok(["choosing", "finished"].includes(battle.phase()));
      }
      assert.equal(battle.phase(), "finished");
    }
  });
});

describe("self-destruct chance", () => {
  it("is zero at full HP and rises as the machine's HP falls", () => {
    const max = 20;
    for (let index = 0; index < ATTACK_COUNT; index += 1) {
      assert.equal(selfDestructChance(index, max, max), 0);
      assert.ok(
        selfDestructChance(index, max * LOW_HP_SHARE, max) >
          selfDestructChance(index, max * HALF, max),
      );
      assert.ok(
        selfDestructChance(index, max * HALF, max) >
          selfDestructChance(index, max - 1, max),
      );
    }
  });

  it("differs per attack and is highest for the existential question", () => {
    const max = 20;
    const chances = ATTACKS.map((_, index) =>
      selfDestructChance(index, max * HALF, max),
    );

    assert.equal(new Set(chances).size, ATTACK_COUNT);
    assert.equal(Math.max(...chances), chances[EXISTENTIAL_QUESTION]);
  });

  it("is not triggered by a roll above the chance", () => {
    const battle = startChoosing(scripted([FIRST_MACHINE_ROLL, 0], MAX_ROLL));

    battle.choose(1);

    assert.equal(battle.outcome(), null);
  });
});

describe("battle layout", () => {
  it("maps points to the attack cells and ignores everything else", () => {
    ATTACK_CELLS.forEach((cell, index) => {
      assert.equal(attackAt({ x: cell.x + 1, y: cell.y + 1 }), index);
    });
    assert.equal(attackAt({ x: 0, y: 0 }), null);
  });

  it("fits every full attack name inside its cell", () => {
    const cell = ATTACK_CELLS[0];
    assert.ok(cell !== undefined);
    for (const { name } of [...ATTACKS, ULTIMATE_ATTACK]) {
      const label = attackLabel(cell, name);

      assert.equal(label.lines.join(" "), name);
      assert.ok(label.x > cell.x && label.y > cell.y);
      for (const line of label.lines) {
        assert.ok(label.x + line.length * GLYPH_ADVANCE <= cell.x + cell.width);
      }
      assert.ok(
        label.y + label.lines.length * LINE_HEIGHT <= cell.y + cell.height,
      );
    }
  });

  it("swaps the weakest attack for the cat picture and keeps four entries", () => {
    const before = attacksFor(false).map((attack) => attack.name);
    const after = createBattle(() => 0, PLAYER_MAX_HP, true).attackNames();

    assert.equal(before.length, ATTACK_COUNT);
    assert.equal(after.length, ATTACK_COUNT);
    assert.ok(!after.includes("Compliment"));
    assert.equal(after[COMPLIMENT], "Show it a picture of a cat");
    assert.deepEqual(after.slice(0, COMPLIMENT), before.slice(0, COMPLIMENT));
  });

  it("wins with the cat picture and its own text", () => {
    const battle = createBattle(() => HALF, PLAYER_MAX_HP, true);
    while (battle.phase() === "message") {
      battle.advance();
    }
    battle.choose(COMPLIMENT);

    assert.equal(battle.outcome(), "won");
    assert.match(pages(battle).join(" "), /fluffy/);
  });
});

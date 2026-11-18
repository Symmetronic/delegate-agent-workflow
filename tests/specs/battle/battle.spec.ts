import { ATTACK_CELLS, attackAt } from "#/src/battle-layout.ts";
import {
  createBattle,
  MACHINE_MAX_HP,
  PLAYER_MAX_HP,
  type Battle,
} from "#/src/battle.ts";
import { createEncounterTrigger } from "#/src/encounter.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const ATTACK_COUNT = 4;
const LAST_ATTACK = 3;
const MIDDLE_ROLL = 0.5;
const MAX_ROLL = 0.999;
const MAX_ROUNDS = 100;
const ENCOUNTER_CHANCE = 0.25;

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

  it("resolves a round with both strikes and returns to selection", () => {
    const battle = startChoosing(() => 0);

    battle.choose(0);

    assert.equal(battle.phase(), "message");
    assert.ok(battle.machineHp() < MACHINE_MAX_HP);
    assert.ok(battle.playerHp() < PLAYER_MAX_HP);
    skipMessages(battle);
    assert.equal(battle.phase(), "choosing");
    assert.equal(battle.outcome(), null);
  });

  it("ignores choices while a message is shown", () => {
    const battle = createBattle(() => 0);

    battle.choose(0);

    assert.equal(battle.machineHp(), MACHINE_MAX_HP);
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
    const battle = startChoosing(() => 0);
    battle.moveSelection("down");

    battle.confirm();

    assert.equal(battle.phase(), "message");
    assert.ok(battle.machineHp() < MACHINE_MAX_HP);
  });

  it("is won once the machine has no HP left and then finishes", () => {
    const battle = startChoosing(() => MAX_ROLL);
    for (
      let round = 0;
      round < MAX_ROUNDS && battle.phase() !== "finished";
      round += 1
    ) {
      if (battle.phase() === "choosing") {
        battle.choose(0);
      }
      battle.advance();
    }

    assert.equal(battle.phase(), "finished");
    assert.equal(battle.outcome(), "won");
    assert.equal(battle.machineHp(), 0);
  });

  it("is lost as a coffee break that restores full HP", () => {
    const battle = startChoosing(() => 0, 1);

    battle.choose(LAST_ATTACK);
    assert.equal(battle.outcome(), "lost");
    assert.equal(battle.playerHp(), PLAYER_MAX_HP);
    skipMessages(battle);
    assert.equal(battle.phase(), "finished");
  });

  it("always ends every round in selection or in a finish", () => {
    for (const roll of [0, MIDDLE_ROLL, MAX_ROLL]) {
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

describe("battle layout", () => {
  it("maps points to the attack cells and ignores everything else", () => {
    ATTACK_CELLS.forEach((cell, index) => {
      assert.equal(attackAt({ x: cell.x + 1, y: cell.y + 1 }), index);
    });
    assert.equal(attackAt({ x: 0, y: 0 }), null);
  });
});

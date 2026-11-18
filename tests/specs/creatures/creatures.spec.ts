import {
  CREATURE_HOMES,
  CREATURE_SPEED,
  MAX_PAUSE,
  WANDER_RADIUS,
  createCreature,
  wander,
  type Creature,
} from "#/src/creatures.ts";
import { isStandingStill } from "#/src/movement.ts";
import { CREATURE_REMARKS, createStory } from "#/src/story.ts";
import {
  PLAYER_START,
  SYSADMIN_TILE,
  TERMINAL_TILES,
  TILE_SIZE,
  isSameTile,
  isWalkable,
  tileAt,
} from "#/src/world.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const HOME = { column: 20, row: 14 };
const SECOND = 1000;
const FRAME = 16;
const MANY_FRAMES = 20_000;
const STEP_MILLISECONDS = (TILE_SIZE * SECOND) / CREATURE_SPEED;
const ROLL_RIGHT = 0.9;
const ROLL_LEFT = 0.6;

const ROLLS: readonly number[] = [
  ROLL_RIGHT,
  ROLL_RIGHT,
  0,
  ROLL_RIGHT,
  ROLL_LEFT,
];

function cycling(): () => number {
  let index = 0;
  return () => {
    index += 1;
    return ROLLS[index % ROLLS.length] ?? 0;
  };
}

function rested(creature: Creature): Creature {
  return { ...creature, pause: 0 };
}

describe("creatures", () => {
  it("wait before they move", () => {
    const creature = createCreature("crow", HOME, () => 0);

    assert.deepEqual(
      wander(
        creature,
        FRAME,
        () => ROLL_RIGHT,
        () => true,
      ).tile,
      HOME,
    );
    assert.ok(
      isStandingStill(
        wander(
          creature,
          FRAME,
          () => ROLL_RIGHT,
          () => true,
        ),
      ),
    );
  });

  it("step one whole tile in a random direction after the pause", () => {
    let creature = wander(
      rested(createCreature("rat", HOME, () => 0)),
      FRAME,
      () => ROLL_RIGHT,
      () => true,
    );
    assert.equal(creature.facing, "right");
    for (let time = 0; time < STEP_MILLISECONDS; time += FRAME) {
      creature = wander(
        creature,
        FRAME,
        () => ROLL_RIGHT,
        () => true,
      );
    }

    assert.deepEqual(creature.tile, { column: HOME.column + 1, row: HOME.row });
    assert.ok(isStandingStill(creature));
    assert.ok(creature.pause > 0);
  });

  it("only turn when the tile ahead is taken", () => {
    const creature = wander(
      rested(createCreature("rat", HOME, () => 0)),
      FRAME,
      () => ROLL_LEFT,
      () => false,
    );

    assert.equal(creature.facing, "left");
    assert.deepEqual(creature.tile, HOME);
    assert.ok(isStandingStill(creature));
  });

  it("stay near their home and on free tiles", () => {
    const random = cycling();
    let creature = createCreature("survivor", HOME, random);
    for (let frame = 0; frame < MANY_FRAMES; frame += 1) {
      creature = wander(creature, MAX_PAUSE / FRAME, random, () => true);
      assert.ok(Math.abs(creature.tile.column - HOME.column) <= WANDER_RADIUS);
      assert.ok(Math.abs(creature.tile.row - HOME.row) <= WANDER_RADIUS);
    }
  });

  it("live on free walkable tiles of the world", () => {
    const taken = [PLAYER_START, SYSADMIN_TILE, ...TERMINAL_TILES];

    assert.ok(
      CREATURE_HOMES.every(
        ({ home }) =>
          isWalkable(tileAt(home.column, home.row)) &&
          !taken.some((tile) => isSameTile(tile, home)),
      ),
    );
  });

  it("each have a remark when talked to", () => {
    const story = createStory();
    story.advance();
    for (const { kind } of CREATURE_HOMES) {
      story.talkToCreature(kind);
      assert.ok(
        CREATURE_REMARKS[kind].startsWith(story.page()?.join(" ") ?? "-"),
      );
      while (story.isOpen()) {
        story.advance();
      }
    }
  });
});

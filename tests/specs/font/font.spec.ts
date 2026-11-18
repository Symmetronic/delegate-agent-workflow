import { ATTACKS, PLAYER_MAX_HP, ULTIMATE_ATTACK } from "#/src/battle.ts";
import { GLYPH_SPRITES } from "#/src/font.ts";

import { MACHINES } from "#/src/machines.ts";
import {
  CREATURE_REMARKS,
  SYSADMIN_WINDOWS,
  sysadminReminder,
  ULTIMATE_REMINDER,
  ULTIMATE_TRADE_WINDOWS,
} from "#/src/story.ts";
import { TERMINAL_CONFESSIONS } from "#/src/terminals.ts";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

function missingGlyphs(text: string): string[] {
  return Array.from(text.toUpperCase()).filter(
    (character) => character !== " " && !(character in GLYPH_SPRITES),
  );
}

describe("font", () => {
  it("has a glyph for every character of the game text", () => {
    const texts = [
      ...SYSADMIN_WINDOWS,
      ...ULTIMATE_TRADE_WINDOWS,
      sysadminReminder(0),
      ULTIMATE_REMINDER,
      ...TERMINAL_CONFESSIONS,
      ...Object.values(CREATURE_REMARKS),
      ...[...ATTACKS, ULTIMATE_ATTACK].flatMap((attack) => [
        attack.name,
        attack.message,
        ...(attack.winMessages ?? []),
      ]),
      ...MACHINES.flatMap((machine) => [
        machine.name,
        machine.counterAttack,
        machine.conversion,
        ...machine.selfDestruct,
      ]),
    ];

    assert.deepEqual(texts.flatMap(missingGlyphs), []);
  });

  it("has a glyph for the HP counter", () => {
    assert.deepEqual(
      missingGlyphs(`${String(PLAYER_MAX_HP)}/${String(PLAYER_MAX_HP)}`),
      [],
    );
  });
});

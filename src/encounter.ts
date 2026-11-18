import type { Random } from "#/src/random.ts";
import { isCableGrass, type TileKind } from "#/src/world.ts";

export const ENCOUNTER_CHANCE = 0.1;

export interface EncounterTrigger {
  stepOnto(kind: TileKind): boolean;
}

export function createEncounterTrigger(
  random: Random,
  chance: number = ENCOUNTER_CHANCE,
): EncounterTrigger {
  return {
    stepOnto(kind) {
      return isCableGrass(kind) && random() < chance;
    },
  };
}

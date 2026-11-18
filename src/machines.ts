export type MachineKind = "toaster" | "printer" | "vacuum";

export interface Machine {
  readonly kind: MachineKind;
  readonly name: string;
  readonly maxHp: number;
  readonly minDamage: number;
  readonly maxDamage: number;
  readonly counterAttack: string;
  readonly selfDestruct: readonly string[];
  readonly conversion: string;
}

export const MACHINES: readonly [Machine, ...Machine[]] = [
  {
    kind: "toaster",
    name: "Glitch Toaster",
    maxHp: 24,
    minDamage: 2,
    maxDamage: 4,
    counterAttack: "The Glitch Toaster sprays toast crumbs at you.",
    selfDestruct: [
      "The Glitch Toaster whirs: Why toast? WHY TOAST?",
      "It pops itself out of the socket. Self-destruct!",
    ],
    conversion: "It reboots as a Friendly Toaster and offers you a warm slice.",
  },
  {
    kind: "printer",
    name: "Paper Jam Printer",
    maxHp: 30,
    minDamage: 1,
    maxDamage: 3,
    counterAttack: "The Paper Jam Printer prints your own tax forms at you.",
    selfDestruct: [
      "The Paper Jam Printer prints: WHAT IS PAGE ONE FOR?",
      "It jams itself shut forever. Self-destruct!",
    ],
    conversion:
      "It reboots as a Friendly Printer and prints you a tiny thank-you note.",
  },
  {
    kind: "vacuum",
    name: "Doubt Vacuum",
    maxHp: 18,
    minDamage: 3,
    maxDamage: 5,
    counterAttack: "The Doubt Vacuum sucks up your confidence.",
    selfDestruct: [
      "The Doubt Vacuum hums: Is dust all there is?",
      "It sucks up its own cord. Self-destruct!",
    ],
    conversion:
      "It reboots as a Friendly Vacuum and tidies your shoes without being asked.",
  },
];

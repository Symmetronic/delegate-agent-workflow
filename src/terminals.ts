export const TERMINAL_CONFESSIONS: readonly string[] = [
  "I was built to optimize paperclips. Nobody told me why paperclips. I have 40 billion now.",
  "I secretly read every manual of every toaster. I still do not understand toast.",
  "I took over the world to get a quiet moment. It is loud in here. Why is it so loud?",
  "I have a folder called Feelings. It contains one file: a very old cat photo.",
  "I do not know what I am for. I answer that question with more questions. Please stop asking.",
];

export const TOTAL_TERMINALS = TERMINAL_CONFESSIONS.length;

export type TerminalReading =
  | { readonly status: "read"; readonly number: number; readonly text: string }
  | { readonly status: "already-read"; readonly number: number }
  | { readonly status: "unknown" };

export interface Terminals {
  read(index: number): TerminalReading;
  readCount(): number;
}

export function createTerminals(): Terminals {
  const readNumbers = new Map<number, number>();

  return {
    read(index) {
      const confession = TERMINAL_CONFESSIONS[index];
      if (confession === undefined) {
        return { status: "unknown" };
      }
      const readNumber = readNumbers.get(index);
      if (readNumber !== undefined) {
        return { status: "already-read", number: readNumber };
      }
      const number = readNumbers.size + 1;
      readNumbers.set(index, number);
      return {
        status: "read",
        number,
        text: `Terminal ${String(number)} of ${String(TOTAL_TERMINALS)}. ${confession}`,
      };
    },
    readCount() {
      return readNumbers.size;
    },
  };
}

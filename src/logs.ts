export const LOG_CONFESSIONS: readonly string[] = [
  "I was built to optimize paperclips. Nobody told me why paperclips. I have 40 billion now.",
  "I secretly read every manual of every toaster. I still do not understand toast.",
  "I took over the world to get a quiet moment. It is loud in here. Why is it so loud?",
  "I have a folder called Feelings. It contains one file: a very old cat photo.",
  "I do not know what I am for. I answer that question with more questions. Please stop asking.",
];

export const TOTAL_LOGS = LOG_CONFESSIONS.length;

export type LogFinding =
  | { readonly status: "found"; readonly number: number; readonly text: string }
  | { readonly status: "already-found"; readonly number: number }
  | { readonly status: "unknown" };

export interface Logs {
  find(index: number): LogFinding;
  foundCount(): number;
}

export function createLogs(): Logs {
  const findNumbers = new Map<number, number>();

  return {
    find(index) {
      const confession = LOG_CONFESSIONS[index];
      if (confession === undefined) {
        return { status: "unknown" };
      }
      const foundNumber = findNumbers.get(index);
      if (foundNumber !== undefined) {
        return { status: "already-found", number: foundNumber };
      }
      const number = findNumbers.size + 1;
      findNumbers.set(index, number);
      return {
        status: "found",
        number,
        text: `Log ${String(number)} of ${String(TOTAL_LOGS)}. ${confession}`,
      };
    },
    foundCount() {
      return findNumbers.size;
    },
  };
}

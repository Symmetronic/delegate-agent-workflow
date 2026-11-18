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
  const found = new Set<number>();

  return {
    find(index) {
      const confession = LOG_CONFESSIONS[index];
      if (confession === undefined) {
        return { status: "unknown" };
      }
      const number = index + 1;
      if (found.has(index)) {
        return { status: "already-found", number };
      }
      found.add(index);
      return {
        status: "found",
        number,
        text: `Log ${String(found.size)} of ${String(TOTAL_LOGS)}. ${confession}`,
      };
    },
    foundCount() {
      return found.size;
    },
  };
}

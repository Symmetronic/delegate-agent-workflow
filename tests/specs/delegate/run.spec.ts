import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const SKILL_DIRECTORY = fileURLToPath(
  new URL("../../../.claude/skills/delegate/", import.meta.url),
);
const RUN_SCRIPT = `${SKILL_DIRECTORY}scripts/run.sh`;

const MALFORMED_TASKS_FILES = {
  "has no tasks": "# Goal\n\nContext.\n",
  "has a ticked task": "# Goal\n\n## [x] 1. First\n\n## [ ] 2. Second\n",
  "skips a task number": "# Goal\n\n## [ ] 1. First\n\n## [ ] 3. Third\n",
  "does not start at task 1": "# Goal\n\n## [ ] 2. Second\n",
  "has a heading without a checkbox": "# Goal\n\n## 1. First\n",
} as const;

interface Outcome {
  readonly status: number | null;
  readonly lines: readonly string[];
}

function run(...args: readonly string[]): Outcome {
  const result = spawnSync("sh", [RUN_SCRIPT, ...args], { encoding: "utf8" });
  return { status: result.status, lines: result.stdout.trimEnd().split("\n") };
}

function runWithTasksFile(tasksFile: string): Outcome {
  const branch = `test-${randomUUID()}`;
  const runDirectory = `${SKILL_DIRECTORY}runs/${branch}`;
  mkdirSync(runDirectory, { recursive: true });
  try {
    writeFileSync(`${runDirectory}/TASKS.md`, tasksFile);
    return run(branch);
  } finally {
    rmSync(runDirectory, { recursive: true, force: true });
  }
}

function assertFailedBeforeStarting(
  outcome: Outcome,
  reason: RegExp,
  message: string,
): void {
  const [outcomeLine = ""] = outcome.lines;
  assert.equal(outcome.status, 1, message);
  assert.equal(outcome.lines.length, 1, message);
  assert.match(
    outcomeLine,
    /^delegate: failed during check prerequisites: .*; nothing was pushed$/u,
    message,
  );
  assert.match(outcomeLine, reason, message);
}

describe("delegate run", () => {
  it("run.sh without a branch fails with its usage as the outcome line", () => {
    assertFailedBeforeStarting(
      run(),
      /usage: run\.sh <branch>/u,
      "must print the usage",
    );
  });

  it("run.sh fails with an outcome line when the branch has no tasks file", () => {
    assertFailedBeforeStarting(
      run(`test-${randomUUID()}`),
      /missing tasks file/u,
      "must name the missing tasks file",
    );
  });

  it("run.sh rejects malformed tasks files before building the image, so that mistakes surface fast", () => {
    for (const [problem, tasksFile] of Object.entries(MALFORMED_TASKS_FILES)) {
      assertFailedBeforeStarting(
        runWithTasksFile(tasksFile),
        /every task heading .* must look like/u,
        `must reject a tasks file that ${problem}`,
      );
    }
  });
});

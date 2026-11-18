import settings from "#/.claude/settings.json" with { type: "json" };
import mcp from "#/.mcp.json" with { type: "json" };
import { preToolUseHooksBlock } from "#/tests/utils/hooks.ts";
import { connectMcpServer } from "#/tests/utils/mcp.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const COMMANDS_THAT_READ_ENV_FILES = [
  "cat .env",
  "grep KEY ./.env",
  "source .env && npm test",
  "cat /workspace/.env",
  `node -e "readFileSync('.env')"`,
] as const;

const COMMANDS_THAT_DO_NOT_READ_ENV_FILES = [
  "echo $NODE_ENV",
  `node -e "process.env.CI"`,
  "cat .env.example",
] as const;

const BROWSER_STARTUP_TIMEOUT_MS = 60_000;
const PAGE_TITLE = "browser-check";

const PAGE_OPENING_TOOLS = [
  "mcp__chrome-devtools__navigate_page",
  "mcp__chrome-devtools__new_page",
] as const;

const LOCAL_URLS = [
  "http://localhost:3000/path",
  "https://127.0.0.1",
  "http://[::1]:8080",
  "data:text/html,<title>local</title>",
  "about:blank",
] as const;

const NON_LOCAL_URLS = [
  "https://example.com",
  "http://localhost.example.com",
  "http://localhost@example.com",
  "file:///workspace/.env",
  "javascript:void(0)",
] as const;

const DELEGATE_SKILL_DIRECTORY = fileURLToPath(
  new URL("../../../.claude/skills/delegate/", import.meta.url),
);
const DELEGATE_RUN_SCRIPT = `${DELEGATE_SKILL_DIRECTORY}scripts/run.sh`;

const MALFORMED_TASKS_FILES = {
  "has no tasks": "# Goal\n\nContext.\n",
  "has a ticked task": "# Goal\n\n## [x] 1. First\n\n## [ ] 2. Second\n",
  "skips a task number": "# Goal\n\n## [ ] 1. First\n\n## [ ] 3. Third\n",
  "does not start at task 1": "# Goal\n\n## [ ] 2. Second\n",
  "has a heading without a checkbox": "# Goal\n\n## 1. First\n",
} as const;

interface DelegateOutcome {
  readonly status: number | null;
  readonly lines: readonly string[];
}

function runDelegate(...args: readonly string[]): DelegateOutcome {
  const result = spawnSync("sh", [DELEGATE_RUN_SCRIPT, ...args], {
    encoding: "utf8",
  });
  return { status: result.status, lines: result.stdout.trimEnd().split("\n") };
}

function runDelegateWithTasksFile(tasksFile: string): DelegateOutcome {
  const branch = `test-${randomUUID()}`;
  const runDirectory = `${DELEGATE_SKILL_DIRECTORY}runs/${branch}`;
  mkdirSync(runDirectory, { recursive: true });
  try {
    writeFileSync(`${runDirectory}/TASKS.md`, tasksFile);
    return runDelegate(branch);
  } finally {
    rmSync(runDirectory, { recursive: true, force: true });
  }
}

function assertDelegateFailedBeforeStarting(
  outcome: DelegateOutcome,
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

describe("agents", () => {
  it(".claude/settings.json denies reading .env files anywhere, so that secrets stay out of the model context", () => {
    assert.ok(
      settings.permissions.deny.includes("Read(//**/.env)"),
      "permissions.deny must contain Read(//**/.env)",
    );
  });

  it(".claude/settings.json blocks Bash commands that reference .env files, so that secrets stay out of the model context", () => {
    for (const command of COMMANDS_THAT_READ_ENV_FILES) {
      assert.ok(
        preToolUseHooksBlock("Bash", { command }),
        `must block: ${command}`,
      );
    }
  });

  it(".claude/settings.json allows Bash commands that do not reference .env files", () => {
    for (const command of COMMANDS_THAT_DO_NOT_READ_ENV_FILES) {
      assert.ok(
        !preToolUseHooksBlock("Bash", { command }),
        `must allow: ${command}`,
      );
    }
  });

  it(".claude/settings.json lets the browser open local URLs", () => {
    for (const tool of PAGE_OPENING_TOOLS) {
      for (const url of LOCAL_URLS) {
        assert.ok(
          !preToolUseHooksBlock(tool, { url }),
          `${tool} must allow ${url}`,
        );
      }
    }
  });

  it(".claude/settings.json blocks the browser from opening non-local URLs, so that it stays inside the Dev Container", () => {
    for (const tool of PAGE_OPENING_TOOLS) {
      for (const url of NON_LOCAL_URLS) {
        assert.ok(
          preToolUseHooksBlock(tool, { url }),
          `${tool} must block ${url}`,
        );
      }
    }
  });

  it(".claude/settings.json enables the chrome-devtools MCP server, so that agents can use the browser without approval", () => {
    assert.ok(
      settings.enabledMcpjsonServers.includes("chrome-devtools"),
      "enabledMcpjsonServers must contain chrome-devtools",
    );
  });

  it(
    ".mcp.json starts a chrome-devtools MCP server that can open pages in the Dev Container's browser",
    { timeout: BROWSER_STARTUP_TIMEOUT_MS },
    async () => {
      await using client = await connectMcpServer(
        mcp.mcpServers["chrome-devtools"],
      );

      const result = await client.callTool("new_page", {
        url: `data:text/html,<title>${PAGE_TITLE}</title>`,
      });

      assert.notEqual(result["isError"], true, JSON.stringify(result));
      assert.match(
        JSON.stringify(result["content"]),
        new RegExp(PAGE_TITLE, "u"),
      );
    },
  );

  it(".claude/skills/delegate/scripts/run.sh without a branch fails with its usage as the outcome line", () => {
    assertDelegateFailedBeforeStarting(
      runDelegate(),
      /usage: run\.sh <branch>/u,
      "must print the usage",
    );
  });

  it(".claude/skills/delegate/scripts/run.sh fails with an outcome line when the branch has no tasks file", () => {
    assertDelegateFailedBeforeStarting(
      runDelegate(`test-${randomUUID()}`),
      /missing tasks file/u,
      "must name the missing tasks file",
    );
  });

  it(".claude/skills/delegate/scripts/run.sh rejects malformed tasks files before building the image, so that mistakes surface fast", () => {
    for (const [problem, tasksFile] of Object.entries(MALFORMED_TASKS_FILES)) {
      assertDelegateFailedBeforeStarting(
        runDelegateWithTasksFile(tasksFile),
        /every task heading .* must look like/u,
        `must reject a tasks file that ${problem}`,
      );
    }
  });
});

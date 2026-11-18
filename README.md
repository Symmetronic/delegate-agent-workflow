# Delegate Agent Workflow

[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-%23FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)

An agent workflow for delegating multiple tasks to agents in parallel and supervising them in a dashboard.

See [CODING_STANDARDS.md](CODING_STANDARDS.md) for the principles and coding standards that apply to this repository.

## Artificial Unintelligence

A Game Boy style top-down game prototype for phones, rendered with Canvas 2D at a logical resolution of 160×144. The screen is scaled by an integer factor in device pixels, centered with a letterbox and follows orientation changes without reload.

### What it is

A prototype to find out how well a Game Boy style game plays on a phone. The machines have taken over but are stuck in a meaning crisis, and the only human weapon left is the uncomfortable question.

### How it is played

Drag anywhere on the screen to walk, tap to talk to the last sysadmin or read a terminal. Arrow keys or WASD walk, Enter confirms. Walking in the cable grass triggers fights against three machine types; pick one of four attacks in the two-by-two grid. Winning converts the machine into something friendly, losing is a coffee break. Find all five confession logs, then talk to the sysadmin: he trades the weakest attack for the ultimate one, "Show it a picture of a cat".

### What is deliberately not in it

No saving, no leveling, no items, no music, no i18n (English only), no on-screen controls and no asset files.

### Sound

All sounds are short blips synthesized with the Web Audio API; there are no audio files and no music. The audio context unlocks on the first touch or key press. Tap with two fingers or press `M` to mute and unmute.

### Build

`npm run build` bundles `src/main.ts` with `esbuild` and writes `dist/index.html` and `dist/game.js`.

### Develop

Run `npm run build`, then serve `dist/` with any static file server, e.g. `npx esbuild --servedir=dist --serve=8000`, and open `http://localhost:8000`. Rebuild after each change.

### Deploy

Deploy exactly the two files in `dist/`: `index.html` and `game.js`.

## Delegate runs

`/delegate <idea>` in Claude Code turns an idea into a pull request:

1. Claude (Opus) grills you about the idea and plans it as a tasks file (`TASKS.md`) of one-commit vertical slices, which you approve.
2. A one-shot container, built from the same Dockerfile as the Dev Container, then works unattended on a new branch:
   1. **Implement step:** Claude (Sonnet) implements each task in its own fresh session, one commit per task.
   2. **Review step:** Claude (Opus) reviews the changes against the tasks and [CODING_STANDARDS.md](CODING_STANDARDS.md) and commits improvements.
   3. The tasks file is removed and Claude (Opus) opens a pull request.

Every commit is checked with `npm run verify` and the branch is pushed after every task and step, so on failure the remote branch keeps the work done so far. The container is removed either way. The run ends with one outcome line: the pull request URL, or the step that failed, why, and whether the remote branch has the work so far. The full log is in `.claude/skills/delegate/runs/<branch>/run.log`.

### Setup

1. Create a Claude token with `claude setup-token`.
2. Create a [fine-grained GitHub personal access token](https://github.com/settings/personal-access-tokens/new) for this repository only, with read and write access to **Contents** and **Pull requests**.
3. Copy `.env.example` to `.env` in the repository root and fill in both tokens. Use plain `KEY=value` lines without quotes.
4. Make sure `git config user.name` and `git config user.email` are set: delegate runs commit as you.

### Secrets

Your `.env` is copied into the container's workspace, as in the Dev Container, so the code under work sees the same environment, guarded by the same rules that keep Claude from reading it. The two delegate tokens are removed from that copy.

The GitHub token is only used by the pipeline script that runs in the container to clone, push and create the pull request; Claude sessions never receive it. The Claude token is visible to the commands, hooks and MCP servers Claude runs in the container. It can't be hidden from them: `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` needs unprivileged user namespaces, which Docker blocks by default, and it forces the permission mode back to default. Even with the scrub, the `claude` process itself holds the token, readable from `/proc/<pid>/environ`. Revoke it if you suspect a leak.

## OpenHands Agent Canvas

[OpenHands Agent Canvas](https://github.com/OpenHands/agent-canvas) runs inside the Dev Container so you can drive agents from your phone on the local network, using Claude Code with your Claude subscription (no API key needed). Canvas starts automatically on container start and attach, on port 8100, kept alive by a supervisor that restarts it whenever it exits. The first launch takes about a minute to become ready.

### Setup

1. Rebuild the Dev Container.
2. Check the Claude Code login with `claude auth status`. If you are not logged in, run `claude auth login` and choose the Claude.ai subscription.
3. In Canvas, set Settings → Agent → Preset to Claude Code.
4. Make port 8100 reachable from your phone:
   - On Windows, allow inbound TCP 8100, for example in an elevated PowerShell:

     ```powershell
     New-NetFirewallRule -DisplayName "OpenHands Agent Canvas" -Direction Inbound -Protocol TCP -LocalPort 8100 -Action Allow
     ```

   - For Docker Engine inside WSL2, set `networkingMode=mirrored` under `[wsl2]` in `%UserProfile%\.wslconfig`, then run `wsl --shutdown`.
5. On the phone, open `http://<laptop-LAN-IP>:8100/canvas` and paste the key from `~/.openhands/canvas-api-key`.

### Files and persistence

- The API key is in `~/.openhands/canvas-api-key`.
- The log is in `~/.openhands/agent-canvas.log`.
- `~/.claude` and `~/.openhands` persist on Docker volumes, so the Claude login and the Canvas settings and key survive rebuilds.

### Security

- Canvas is served over plain HTTP, so use it on trusted networks only. For remote access, use [Tailscale](https://tailscale.com).
- Anyone with the key can run commands in the container, on the real `/workspace`.
- The laptop must stay awake with the container running.

### Restarting Canvas

Kill the `agent-canvas` process with `pkill -f '^node .*agent-canvas'`. The supervisor brings it back. A plain `pkill -f agent-canvas` would also kill the supervisor, whose command line contains `agent-canvas` too, and Canvas would stay down until the container restarts or is attached again.

# Add OpenHands Agent Canvas to the Dev Container

Run OpenHands Agent Canvas inside the Dev Container so agents can be driven from a phone on the local network, using Claude Code with the user's Claude subscription (the login already lives on the existing `~/.claude` volume, so no API key is needed). Take inspiration from the OpenHands changes on https://github.com/Symmetronic/nodejs-template/tree/openhands-agent-canvas (commits "chore: Setup OpenHands Agent Canvas" and "chore: Improve setup"), but adopt only the OpenHands parts: not its Stop hook, lint-staged, husky, tsconfig, `@tsconfig/node24` or `apt-get upgrade` changes. Follow this repository's existing conventions (pinned tool versions via Dockerfile `ARG`s, telemetry opt-outs as Dockerfile `ENV`, the `USERNAME` variable, feature docs as root README sections). Delegate runs build the same image; they will install but never start Canvas, which is accepted (no separate image target).

## [x] 1. Agent Canvas runs automatically in the Dev Container

**Blocked by:** None

**Delivers:** After rebuilding the Dev Container, Agent Canvas is installed and starts by itself on port 8100 on all interfaces in public mode, kept alive by a supervisor, with no manual start needed.

- The image installs `uv` and `@openhands/agent-canvas`, each pinned via its own Dockerfile `ARG` (`UV_VERSION`, `AGENT_CANVAS_VERSION`) set to the newest release published at least two weeks ago; `uv` is installed from its versioned installer URL, not `latest`, and is on `PATH` for the container user
- `AGENT_CANVAS_DISABLE_TELEMETRY=1` is set as a Dockerfile `ENV`, next to `DO_NOT_TRACK`
- Port 8100 is published on `0.0.0.0` (via `runArgs`) and labelled "OpenHands Agent Canvas" in `portsAttributes` without auto-forward
- `~/.openhands` is a named Docker volume (`openhands-data-${devcontainerId}`) so Canvas settings and the API key survive rebuilds; the post-create script creates it and gives the container user ownership
- A start script starts Canvas under a supervisor that restarts it whenever it exits, with `LOCAL_BACKEND_API_KEY` read from `~/.openhands/canvas-api-key` (generated once with mode 600 if missing) and output logged to `~/.openhands/agent-canvas.log`
- The start script is idempotent: a lock held by the supervisor (plus a check whether port 8100 already answers) makes repeated invocations no-ops that report Canvas is already running
- The start script runs from both the post-start script and a `postAttachCommand`, and puts `uv`/`uvx` on `PATH` itself since lifecycle commands do not load the login profile
- The delegate pipeline (which only runs post-create) is unaffected and does not start Canvas
- `npm run verify` passes

## [ ] 2. Document Agent Canvas in the README

**Blocked by:** 1

**Delivers:** A user can go from a rebuilt Dev Container to using Agent Canvas on their phone by following an "OpenHands Agent Canvas" section in the root README.

- Explains that Canvas starts automatically on container start and attach, on port 8100, kept alive by a supervisor, and takes about a minute to become ready on first launch
- Setup steps: rebuild the Dev Container; check the Claude Code login (`claude auth status`, `claude auth login` with the Claude.ai subscription if needed); set Settings → Agent → Preset to Claude Code in Canvas; allow inbound TCP 8100 on Windows (`New-NetFirewallRule` example) and, for Docker Engine inside WSL2, `networkingMode=mirrored` in `.wslconfig` followed by `wsl --shutdown`; open `http://<laptop-LAN-IP>:8100/canvas` on the phone and paste the key from `~/.openhands/canvas-api-key`
- Names the key file, the log file, and that `~/.claude` and `~/.openhands` persist on Docker volumes
- Security notes: plain HTTP so trusted networks only (suggest Tailscale for remote access); anyone with the key can run commands in the container on the real `/workspace`; the laptop must stay awake with the container running
- Explains how to restart Canvas (kill the agent-canvas process; the supervisor brings it back)
- `npm run verify` passes

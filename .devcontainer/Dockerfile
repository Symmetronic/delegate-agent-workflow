ARG NODE_VERSION="24"

FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}

ARG CLAUDE_CODE_VERSION="2.1.322"
ARG GITHUB_CLI_VERSION="2.103.3"
ARG USERNAME="node"
ARG UV_VERSION="0.13.7"
ARG AGENT_CANVAS_VERSION="1.34.0"

ENV USERNAME="${USERNAME}"
ENV CLAUDE_CONFIG_DIR="/home/${USERNAME}/.claude"
ENV DO_NOT_TRACK="1"
ENV AGENT_CANVAS_DISABLE_TELEMETRY="1"
ENV NPM_REGISTRY="https://registry.npmjs.org/"
ENV PATH="/home/${USERNAME}/.local/bin:${PATH}"

USER root

RUN curl -fsSL --output /tmp/gh.deb \
    "https://github.com/cli/cli/releases/download/v${GITHUB_CLI_VERSION}/gh_${GITHUB_CLI_VERSION}_linux_$(dpkg --print-architecture).deb" \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    /tmp/gh.deb \
  && rm -rf /var/lib/apt/lists/* /tmp/gh.deb

USER ${USERNAME}

RUN mkdir -p "$CLAUDE_CONFIG_DIR"
RUN curl -LsSf "https://astral.sh/uv/${UV_VERSION}/install.sh" | sh
RUN npm install --global \
  "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" \
  "@openhands/agent-canvas@${AGENT_CANVAS_VERSION}"

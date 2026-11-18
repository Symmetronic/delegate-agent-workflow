#!/bin/sh
# Usage: run.sh <branch>
# Runs a delegate run for the tasks file in runs/<branch>/TASKS.md inside a one-shot container.
# Logs to runs/<branch>/run.log and prints one outcome line: the pull request URL or why the run failed.

set -u

readonly BRANCH="${1:-}"
SKILL_DIRECTORY="$(cd "$(dirname "$0")/.." && pwd)"
readonly SKILL_DIRECTORY
REPOSITORY_ROOT="$(git -C "$SKILL_DIRECTORY" rev-parse --show-toplevel)"
readonly REPOSITORY_ROOT
readonly RUN_DIRECTORY="$SKILL_DIRECTORY/runs/$BRANCH"
readonly TASKS_FILE="$RUN_DIRECTORY/TASKS.md"
readonly LOG_FILE="$RUN_DIRECTORY/run.log"
readonly SECRETS_FILE="$REPOSITORY_ROOT/.env"
readonly PIPELINE_SCRIPT="$SKILL_DIRECTORY/scripts/pipeline.sh"
readonly IMAGE_NAME="delegate-devcontainer"
CONTAINER_NAME="delegate-$(printf '%s' "$BRANCH" | tr -c '[:alnum:]_.-' '-')"
readonly CONTAINER_NAME
readonly CONTAINER_PIPELINE_SCRIPT="/tmp/delegate-pipeline.sh"
readonly CONTAINER_TASKS_FILE="/tmp/delegate-TASKS.md"
readonly CONTAINER_SECRETS_FILE="/tmp/delegate-secrets"
readonly OUTCOME_PREFIX="delegate: "

current_step="check prerequisites"

fail() {
  echo "${OUTCOME_PREFIX}failed during $current_step: $*; nothing was pushed"
  exit 1
}

start_step() {
  current_step="$1"
  echo "==> $current_step"
}

require_branch_and_tasks_file() {
  [ -n "$BRANCH" ] || fail "usage: run.sh <branch>"
  [ -f "$TASKS_FILE" ] || fail "missing tasks file $TASKS_FILE"
}

require_docker() {
  docker info >/dev/null 2>&1 \
    || fail "Docker is not available; rebuild the dev container to get Docker-in-Docker"
}

require_secret() {
  grep -Eq "^$1=.+" "$SECRETS_FILE" 2>/dev/null \
    || fail "$SECRETS_FILE must define a non-empty $1 (see .env.example)"
}

require_git_identity() {
  git config user.name >/dev/null && git config user.email >/dev/null \
    || fail "git user.name and user.email must be set"
}

require_no_container_for_branch() {
  if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    fail "a delegate run for $BRANCH is already running (container $CONTAINER_NAME)"
  fi
}

repository_https_url() {
  git -C "$REPOSITORY_ROOT" remote get-url origin \
    | sed -E 's#^git@([^:]+):#https://\1/#; s#^ssh://git@([^/]+)/#https://\1/#'
}

remove_container() {
  docker rm --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
}

build_image() {
  docker build --tag "$IMAGE_NAME" "$REPOSITORY_ROOT/.devcontainer"
}

create_container() {
  docker create \
    --name "$CONTAINER_NAME" \
    --env "BRANCH=$BRANCH" \
    --env "REPOSITORY_URL=$(repository_https_url)" \
    --env "GIT_USER_NAME=$(git config user.name)" \
    --env "GIT_USER_EMAIL=$(git config user.email)" \
    --env "TASKS_FILE=$CONTAINER_TASKS_FILE" \
    --env "SECRETS_FILE=$CONTAINER_SECRETS_FILE" \
    "$IMAGE_NAME" \
    sh "$CONTAINER_PIPELINE_SCRIPT" >/dev/null
}

copy_inputs_into_container() {
  docker cp --archive "$PIPELINE_SCRIPT" "$CONTAINER_NAME:$CONTAINER_PIPELINE_SCRIPT" \
    && docker cp --archive "$TASKS_FILE" "$CONTAINER_NAME:$CONTAINER_TASKS_FILE" \
    && docker cp --archive "$SECRETS_FILE" "$CONTAINER_NAME:$CONTAINER_SECRETS_FILE"
}

run_delegate() {
  require_secret CLAUDE_CODE_OAUTH_TOKEN
  require_secret GH_TOKEN
  require_git_identity
  require_docker
  require_no_container_for_branch

  trap remove_container EXIT
  trap 'exit 1' INT TERM

  start_step "build image"
  build_image || fail "docker build failed"
  start_step "start container"
  create_container || fail "docker create failed"
  copy_inputs_into_container || fail "copying inputs into the container failed"
  docker start --attach "$CONTAINER_NAME"
}

report_outcome() {
  outcome="$(grep "^$OUTCOME_PREFIX" "$LOG_FILE" | tail -n 1)"
  echo "${outcome:-${OUTCOME_PREFIX}failed without reporting an outcome; see $LOG_FILE}"
}

main() {
  require_branch_and_tasks_file
  (run_delegate) >"$LOG_FILE" 2>&1
  exit_status=$?
  report_outcome
  exit "$exit_status"
}

main

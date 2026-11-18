#!/bin/sh
# Runs inside the delegate container, started by run.sh.
# Secrets live only in non-exported shell variables; Claude sessions never receive GH_TOKEN.

set -eu

readonly WORKSPACE="/workspace"
readonly MAIN_BRANCH="main"
readonly TASKS_FILE_IN_REPOSITORY="TASKS.md"
readonly CODING_STANDARDS_FILE="CODING_STANDARDS.md"
readonly LARGE_MODEL="opus"
readonly SMALL_MODEL="sonnet"

current_step="setup"
failure_reason=""
branch_pushed=false
github_token=""
claude_token=""
pull_request_title_file=""
pull_request_body_file=""

fail() {
  failure_reason="$*"
  exit 1
}

branch_url() {
  echo "${REPOSITORY_URL%.git}/tree/$BRANCH"
}

report_failure() {
  exit_status=$?
  if [ "$exit_status" -ne 0 ]; then
    failure="failed during $current_step${failure_reason:+: $failure_reason}"
    if [ "$branch_pushed" = true ]; then
      echo "delegate: $failure; work so far is on $(branch_url)"
    else
      echo "delegate: $failure; nothing was pushed"
    fi
  fi
  exit "$exit_status"
}

start_step() {
  current_step="$1"
  echo "==> $current_step"
}

read_secret() {
  sed -n "s/^$1=//p" "$SECRETS_FILE" | tail -n 1 | tr -d '\r'
}

load_secrets() {
  github_token="$(read_secret GH_TOKEN)"
  claude_token="$(read_secret CLAUDE_CODE_OAUTH_TOKEN)"
  readonly github_token claude_token
  rm -f "$SECRETS_FILE"
}

git_with_github_token() {
  # https://git-scm.com/docs/gitcredentials#_custom_helpers
  # shellcheck disable=SC2016 # $1 and $GH_TOKEN must expand inside the helper, not here.
  GH_TOKEN="$github_token" git \
    -c credential.helper= \
    -c 'credential.helper=!f() { test "$1" = get && printf "username=x-access-token\npassword=%s\n" "$GH_TOKEN"; }; f' \
    "$@"
}

gh_with_github_token() {
  GH_TOKEN="$github_token" gh "$@"
}

run_claude_session() {
  model="$1"
  shift
  env -u GH_TOKEN \
    CLAUDE_CODE_OAUTH_TOKEN="$claude_token" \
    claude --print --model "$model" --dangerously-skip-permissions "$@"
}

clone_repository() {
  sudo mkdir -p "$WORKSPACE"
  sudo chown "$(id -un):$(id -gn)" "$WORKSPACE"
  git_with_github_token clone --branch "$MAIN_BRANCH" "$REPOSITORY_URL" "$WORKSPACE"
  cd "$WORKSPACE" || exit
  git config --global user.name "$GIT_USER_NAME"
  git config --global user.email "$GIT_USER_EMAIL"
}

install_dependencies() {
  sh .devcontainer/scripts/post-create.sh
}

push_branch() {
  git_with_github_token push --quiet --set-upstream origin "$BRANCH"
  branch_pushed=true
}

push_new_branch() {
  # An empty lease value makes the push fail if the branch already exists on the remote: https://git-scm.com/docs/git-push#Documentation/git-push.txt---force-with-leaseltrefnamegtltexpectgt
  git_with_github_token push --quiet --set-upstream --force-with-lease="$BRANCH:" origin "$BRANCH" \
    || fail "pushing the new branch failed; it may already exist on the remote"
  branch_pushed=true
}

require_clean_working_tree() {
  [ -z "$(git status --porcelain)" ] || fail "the session left uncommitted changes"
}

require_one_commit_since() {
  base_commit="$1"
  [ "$(git rev-list --count "$base_commit..HEAD")" -eq 1 ] || fail "the session did not produce exactly one commit"
}

require_all_tasks_done() {
  if grep -Eq '^## \[ \]' "$TASKS_FILE_IN_REPOSITORY"; then
    fail "not every task in $TASKS_FILE_IN_REPOSITORY is ticked"
  fi
}

verify_every_commit_since() {
  base_commit="$1"
  installed_commit="$(git rev-parse HEAD)"
  for commit in $(git rev-list --reverse "$base_commit..HEAD"); do
    echo "--> verify $(git log -1 --format='%h %s' "$commit")"
    git checkout --quiet "$commit"
    if ! git diff --quiet "$installed_commit" "$commit" -- package-lock.json; then
      npm ci
      installed_commit="$commit"
    fi
    npm run verify || fail "npm run verify fails on commit $commit"
  done
  git checkout --quiet "$BRANCH"
}

commit_tasks_file() {
  git switch --create "$BRANCH"
  cp "$TASKS_FILE" "$TASKS_FILE_IN_REPOSITORY"
  git add "$TASKS_FILE_IN_REPOSITORY"
  git commit --quiet --message "chore: Add tasks"
  push_new_branch
}

unticked_task_numbers() {
  sed -n 's/^## \[ \] \([0-9][0-9]*\)\..*/\1/p' "$TASKS_FILE_IN_REPOSITORY"
}

require_task_ticked() {
  task_number="$1"
  grep -Eq "^## \[x\] $task_number\." "$TASKS_FILE_IN_REPOSITORY" \
    || fail "task $task_number is not ticked in $TASKS_FILE_IN_REPOSITORY"
}

implement_task() {
  task_number="$1"
  base_commit="$(git rev-parse HEAD)"
  run_claude_session "$SMALL_MODEL" "Read the whole tasks file $TASKS_FILE_IN_REPOSITORY for context, but implement only task $task_number, which is the one task for this session.

1. Make the change the task describes, meeting all its acceptance criteria.
2. Run \`npm run verify\` and fix the code until it passes.
3. Tick task $task_number's heading checkbox in $TASKS_FILE_IN_REPOSITORY (\`## [ ] $task_number.\` becomes \`## [x] $task_number.\`).
4. Commit everything as exactly one Conventional Commit with a capitalized summary.

Never push. Never change other tasks in $TASKS_FILE_IN_REPOSITORY. Finish with a clean working tree."
  push_branch
  require_clean_working_tree
  require_one_commit_since "$base_commit"
  require_task_ticked "$task_number"
  verify_every_commit_since "$base_commit"
}

implement_tasks() {
  for task_number in $(unticked_task_numbers); do
    start_step "implement step (task $task_number)"
    implement_task "$task_number"
  done
  require_all_tasks_done
}

review_changes() {
  base_commit="$(git rev-parse HEAD)"
  run_claude_session "$LARGE_MODEL" \
    --append-system-prompt-file "$CODING_STANDARDS_FILE" \
    "Review the changes on this branch against origin/$MAIN_BRANCH (\`git log origin/$MAIN_BRANCH..HEAD\`, \`git diff origin/$MAIN_BRANCH...HEAD\`).

$TASKS_FILE_IN_REPOSITORY describes what the changes must achieve. Check that every task is fully and correctly implemented, and that the changes follow the coding standards in your system prompt.

Fix every problem you find directly. Commit each improvement as one focused Conventional Commit with a capitalized summary, and make sure \`npm run verify\` passes after each commit. Do not change $TASKS_FILE_IN_REPOSITORY. Never push. Finish with a clean working tree."
  push_branch
  require_clean_working_tree
  verify_every_commit_since "$base_commit"
}

remove_tasks_file() {
  git rm --quiet "$TASKS_FILE_IN_REPOSITORY"
  git commit --quiet --message "chore: Remove tasks"
  push_branch
}

write_pull_request() {
  pull_request_directory="$(mktemp -d)"
  pull_request_title_file="$pull_request_directory/title.txt"
  pull_request_body_file="$pull_request_directory/body.md"
  run_claude_session "$LARGE_MODEL" "Write the pull request for branch $BRANCH into $MAIN_BRANCH.

The changes implement this tasks file:

<tasks-file>
$(cat "$TASKS_FILE")
</tasks-file>

Inspect the changes with \`git log origin/$MAIN_BRANCH..HEAD\` and \`git diff origin/$MAIN_BRANCH...HEAD\`. Then:
- Write the title as a Conventional Commit summary with a capitalized subject to $pull_request_title_file.
- Write the body using the pr skill to $pull_request_body_file, ending with the line: 🤖 Generated with [Claude Code](https://claude.com/claude-code)

Do not change any file in the repository, do not commit, do not push and do not run gh."
  [ -s "$pull_request_title_file" ] || fail "the session wrote no pull request title"
  [ -s "$pull_request_body_file" ] || fail "the session wrote no pull request body"
}

create_pull_request() {
  pull_request_url="$(gh_with_github_token pr create \
    --base "$MAIN_BRANCH" \
    --head "$BRANCH" \
    --title "$(head -n 1 "$pull_request_title_file")" \
    --body-file "$pull_request_body_file")"
  echo "delegate: pull request $pull_request_url"
}

main() {
  trap report_failure EXIT
  load_secrets

  start_step "clone repository"
  clone_repository
  start_step "install dependencies"
  install_dependencies
  start_step "commit tasks file"
  commit_tasks_file
  implement_tasks
  start_step "review step"
  review_changes
  start_step "remove tasks file"
  remove_tasks_file
  start_step "write pull request"
  write_pull_request
  start_step "create pull request"
  create_pull_request
}

main

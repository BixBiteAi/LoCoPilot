#!/usr/bin/env bash
# Squash this repo's history into one commit so only you show as contributor.
# Only affects the repo you run this in (e.g. LoCoPilot only, not the parent folder).
#
# For LoCoPilot editor only (recommended):
#   cd /path/to/LoCoPilot    # the LoCoPilot folder that has .git
#   ./scripts/squash-history-single-contributor.sh
#   git push origin main --force
#
# Run from the repo root (the folder that contains .git). After this, force-push.

set -e

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Error: Not inside a git repository. Run this from your repo root (e.g. inside LoCoPilot)."
  exit 1
fi

REPO_ROOT=$(git rev-parse --show-toplevel)
echo "Repo root: $REPO_ROOT"
echo "This will replace all history with a single commit. Current branch: $(git branch --show-current)"
echo "Make sure you have pushed any work you need; then you will force-push after."
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Orphan branch = no history
git checkout --orphan new-main

# Add all files; if nested git repos break 'git add -A', add with excludes
if ! git add -A 2>/dev/null; then
  git reset
  echo "Adding with nested .git dirs excluded (nested repos will not be in the commit)..."
  EXCLUDES=()
  while IFS= read -r dir; do
    [[ -n "$dir" ]] && EXCLUDES+=( ":(exclude)$dir" )
  done < <(cd "$REPO_ROOT" && find . -name .git -type d | sed 's|/.git$||' | sed 's|^\./||')
  git add -A "${EXCLUDES[@]}"
fi

git commit -m "Initial commit" --no-verify

# Replace main with this history
git branch -D main 2>/dev/null || true
git branch -m main

echo ""
echo "Done. To update GitHub (rewrites remote history):"
echo "  git push origin main --force"
echo ""
echo "Only the author of the new commit will show as contributor."

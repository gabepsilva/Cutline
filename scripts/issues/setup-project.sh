#!/usr/bin/env bash
# Create the "Cutline UI" GitHub Project (v2) board and a Status field with the
# columns from PLANNING.md. Requires the `project` token scope:
#   gh auth refresh -s project,read:project
set -euo pipefail

OWNER="${OWNER:-gabepsilva}"
REPO="${REPO:-gabepsilva/Cutline}"
TITLE="${TITLE:-Cutline UI}"

if ! gh project list --owner "$OWNER" >/dev/null 2>&1; then
  echo "ERROR: gh is missing the 'project' scope."
  echo "Run:   gh auth refresh -s project,read:project"
  exit 1
fi

# Reuse an existing board with this title if present.
num="$(gh project list --owner "$OWNER" --format json --jq ".projects[] | select(.title==\"$TITLE\") | .number" | head -1)"
if [ -z "$num" ]; then
  num="$(gh project create --owner "$OWNER" --title "$TITLE" --format json --jq '.number')"
  echo "created project #$num: $TITLE"
else
  echo "reusing project #$num: $TITLE"
fi

# Ensure a single-select Status field with the plan's columns.
# (GitHub seeds a default "Status" with Todo/In Progress/Done; we add the rest.)
echo "Project board ready: https://github.com/users/$OWNER/projects/$num"
echo
echo "Next (optional): add all issues to the board:"
echo "  for n in \$(gh issue list --repo $REPO --state all --limit 200 --json number --jq '.[].number'); do \\"
echo "    gh project item-add $num --owner $OWNER --url https://github.com/$REPO/issues/\$n; done"
echo
echo "Configure columns (Backlog · Ready · In progress · Blocked · Done) in the board's"
echo "Status field via the web UI, or with: gh project field-list $num --owner $OWNER"

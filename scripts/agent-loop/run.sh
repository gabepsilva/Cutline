#!/usr/bin/env bash
# Poll for open GitHub issues; when any exist, run cursor-agent once, then lead review.
#
# Usage:
#   ./scripts/agent-loop/run.sh
#
# Env:
#   AGENT_LOOP_INTERVAL       seconds between polls when idle (default: 30)
#   AGENT_LOOP_CYCLE_PAUSE    seconds after a full cycle (default: 60)
#   CURSOR_AGENT_BIN          default: cursor-agent
#   AGENT_LOOP_MODEL          cursor-agent --model (default: auto)
#   AGENT_LOOP_LEAD_MODEL     claude --model (default: opus)
#   LEAD_AGENT_BIN            default: claude
#   AGENT_LOOP_WORKSPACE      default: repo root

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE="${AGENT_LOOP_WORKSPACE:-$REPO_ROOT}"
AGENT_BIN="${CURSOR_AGENT_BIN:-cursor-agent}"
LEAD_BIN="${LEAD_AGENT_BIN:-claude}"
INTERVAL="${AGENT_LOOP_INTERVAL:-30}"
CYCLE_PAUSE="${AGENT_LOOP_CYCLE_PAUSE:-60}"
CURSOR_MODEL="${AGENT_LOOP_MODEL:-auto}"
LEAD_MODEL="${AGENT_LOOP_LEAD_MODEL:-opus}"
ABORT_FILE="$SCRIPT_DIR/abort"

read -r -d '' PROMPT <<EOF || true
Look at the open GitHub issues for this repo and decide what issue or set of issues comes next (try to batch some issues if they are super small).

Then do the full workflow for that one issue:
1. Implement it (read the issue, PLANNING.md, AGENTS.md).
2. Open a PR.
3. Watch CI and fix anything that fails until checks are green.
4. If useful for the lead, add a short "Notes for lead" section to the PR body.

Work on a single issue only.

If you finish successfully (PR open, CI green, ready for lead review), stop without creating any abort file.

If you are blocked and cannot deliver a PR with passing CI ready for lead review, create this file with a one-line reason:
${ABORT_FILE}
EOF

read -r -d '' LEAD_PROMPT <<'EOF' || true
You are the lead reviewer for the Cutline repo.

Review the latest updated pull request:
1. Read the PR and its linked issue; check PLANNING.md and AGENTS.md expectations.
2. Fix anything you find necessary and push commits to the same PR branch.
3. Monitor CI on the PR (`gh pr checks --watch`) until all required checks are green.
4. Merge the PR to master when CI is green and the change is ready.
5. Monitor CI on master after the merge.
6. Verify deployment is healthy at https://cutline.i.psilva.org (and `/healthz` if useful).
7. Close the issues about this PR when the app is deployed and healthy.
Work autonomously. When merge and post-merge CI/deploy look good, stop.
EOF

agent_args=(-p --trust --yolo --approve-mcps --workspace "$WORKSPACE" --model "$CURSOR_MODEL")
lead_args=(-p --dangerously-skip-permissions --model "$LEAD_MODEL")

has_open_issues() {
	[[ $(gh issue list --state open --limit 1 --json number -q 'length') -gt 0 ]]
}

run_lead_review() {
	echo "[$(date -Iseconds)] running lead review ($LEAD_BIN --model $LEAD_MODEL)"
	cd "$REPO_ROOT"
	# --dangerously-skip-permissions ≈ cursor-agent --yolo / --force
	if ! "$LEAD_BIN" "${lead_args[@]}" "$LEAD_PROMPT" < /dev/null; then
		echo "[$(date -Iseconds)] WARN: lead review exited non-zero — continuing loop"
		return 1
	fi
	return 0
}

run_agent() {
	rm -f "$ABORT_FILE"
	echo "[$(date -Iseconds)] open issues found — running cursor-agent (--model $CURSOR_MODEL)"
	# shellcheck disable=SC2068
	"$AGENT_BIN" "${agent_args[@]}" "$PROMPT" < /dev/null

	if [[ -f "$ABORT_FILE" ]]; then
		echo "[$(date -Iseconds)] abort file present — exiting loop"
		echo "Reason: $(head -n1 "$ABORT_FILE")"
		exit 1
	fi

	run_lead_review || true

	echo "[$(date -Iseconds)] cycle complete — sleeping ${CYCLE_PAUSE}s"
	sleep "$CYCLE_PAUSE"
}

echo "[$(date -Iseconds)] agent-loop started (poll every ${INTERVAL}s, cursor=$CURSOR_MODEL, lead=$LEAD_MODEL)"

while true; do
	if has_open_issues; then
		run_agent
	else
		echo "[$(date -Iseconds)] no open issues — sleeping ${INTERVAL}s"
		sleep "$INTERVAL"
	fi
done

#!/usr/bin/env bash
# Poll for open, non-draft GitHub issues; when any exist, run cursor-agent once, then lead review.
#
# Usage:
#   ./scripts/agent-loop/run.sh [--cursor-lead]
#
# Options:
#   --cursor-lead   Run lead review with cursor-agent (--model auto) instead of claude
#
# Env:
#   AGENT_LOOP_INTERVAL       seconds between polls when idle (default: 30)
#   AGENT_LOOP_CYCLE_PAUSE    seconds after a full cycle (default: 60)
#   CURSOR_AGENT_BIN          default: cursor-agent
#   AGENT_LOOP_MODEL          cursor-agent --model (default: auto)
#   AGENT_LOOP_LEAD_MODEL     lead --model (default: opus for claude, auto for --cursor-lead)
#   LEAD_AGENT_BIN            default: claude (ignored with --cursor-lead)
#   AGENT_LOOP_WORKSPACE      default: repo root

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKSPACE="${AGENT_LOOP_WORKSPACE:-$REPO_ROOT}"
AGENT_BIN="${CURSOR_AGENT_BIN:-cursor-agent}"
INTERVAL="${AGENT_LOOP_INTERVAL:-30}"
CYCLE_PAUSE="${AGENT_LOOP_CYCLE_PAUSE:-60}"
CURSOR_MODEL="${AGENT_LOOP_MODEL:-auto}"
ABORT_FILE="$SCRIPT_DIR/abort"
LEAD_USE_CURSOR=false

while [[ $# -gt 0 ]]; do
	case "$1" in
	--cursor-lead)
		LEAD_USE_CURSOR=true
		shift
		;;
	*)
		echo "Unknown option: $1" >&2
		exit 1
		;;
	esac
done

if [[ "$LEAD_USE_CURSOR" == true ]]; then
	LEAD_BIN="$AGENT_BIN"
	LEAD_MODEL="${AGENT_LOOP_LEAD_MODEL:-auto}"
	lead_args=(-p --trust --yolo --approve-mcps --workspace "$WORKSPACE" --model "$LEAD_MODEL")
else
	LEAD_BIN="${LEAD_AGENT_BIN:-claude}"
	LEAD_MODEL="${AGENT_LOOP_LEAD_MODEL:-opus}"
	lead_args=(-p --dangerously-skip-permissions --model "$LEAD_MODEL")
fi

read -r -d '' PROMPT <<EOF || true
Look at the open GitHub issues for this repo (ignore issues in draft state) and decide what set of issues comes next (try to batch some issues if they are super small or tackle one issue at a time if they are bigger).

Then do the full workflow for that set of issues (or issue):
1. Implement it (read the issues, PLANNING.md, AGENTS.md).
2. Open a PR.
3. Watch CI and fix anything that fails until checks are green.

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

has_open_issues() {
	[[ $(gh issue list --search 'is:open is:issue -draft:true' --limit 1 --json number -q 'length') -gt 0 ]]
}

run_lead_review() {
	if [[ "$LEAD_USE_CURSOR" == true ]]; then
		echo "[$(date -Iseconds)] running lead review (cursor-agent --model $LEAD_MODEL)"
	else
		echo "[$(date -Iseconds)] running lead review ($LEAD_BIN --model $LEAD_MODEL)"
	fi
	cd "$REPO_ROOT"
	if ! "$LEAD_BIN" "${lead_args[@]}" "$LEAD_PROMPT" < /dev/null; then
		echo "[$(date -Iseconds)] lead review failed — exiting loop"
		exit 1
	fi
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

	run_lead_review

	echo "[$(date -Iseconds)] cycle complete — sleeping ${CYCLE_PAUSE}s"
	sleep "$CYCLE_PAUSE"
}

lead_label="$LEAD_BIN"
[[ "$LEAD_USE_CURSOR" == true ]] && lead_label="cursor-agent"
echo "[$(date -Iseconds)] agent-loop started (poll every ${INTERVAL}s, cursor=$CURSOR_MODEL, lead=$lead_label/$LEAD_MODEL)"

while true; do
	if has_open_issues; then
		run_agent
	else
		echo "[$(date -Iseconds)] no actionable issues (open, non-draft) — sleeping ${INTERVAL}s"
		sleep "$INTERVAL"
	fi
done

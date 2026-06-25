# Gets path of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Prompt for cursor-agent
read -r -d '' PROMPT <<EOF || true
Look at the open GitHub issues for this repo and decide what set of issues comes next (try to batch some issues if they are super small or tackle one issue at a time if they are bigger).

EOF


# Checks if there are open issues
has_open_issues() {
	[[ $(gh issue list --state open --limit 1 --json number -q 'length') -gt 0 ]]
}


run_agent() {

	ABORT_FILE="$SCRIPT_DIR/abort"
	rm -f "$ABORT_FILE"

	cursor-agent --yolo --print  "'$PROMPT'" < /dev/null

	if [[ -f "$ABORT_FILE" ]]; then
		echo "[$(date -Iseconds)] abort file present — exiting loop"
		echo "Reason: $(head -n1 "$ABORT_FILE")"
		exit 1
	fi

	#run_lead_review

	echo "[$(date -Iseconds)] cycle complete — sleeping ${CYCLE_PAUSE}s"
	sleep "$CYCLE_PAUSE"
}


while true; do
	if has_open_issues; then
		echo "[$(date -Iseconds)] open issues found — running cursor-agent"
		run_agent
	else
		INTERVAL=60
		echo "[$(date -Iseconds)] no open issues - sleeping ${INTERVAL}s"
		sleep "$INTERVAL"
	fi
done
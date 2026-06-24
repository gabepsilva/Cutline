#!/usr/bin/env bash
# Fail CI when bun audit reports high or critical vulnerabilities.
set -euo pipefail

output="$(bun audit 2>&1)" || audit_exit=$?
echo "$output"

if echo "$output" | grep -qE '^\s+(high|critical):'; then
	echo "::error::High or critical vulnerabilities found — run 'bun audit' locally"
	exit 1
fi

# bun audit exits 1 for any severity; only fail the step on high/critical above.
exit 0

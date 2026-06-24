#!/usr/bin/env bash
# Fail only on high/critical OSV findings (CVSS >= 7). Moderate/low are reported but not gated.
set -euo pipefail

scanner="${OSV_SCANNER_BIN:-}"
if [ -z "$scanner" ]; then
	if command -v osv-scanner >/dev/null 2>&1; then
		scanner="$(command -v osv-scanner)"
	else
		scanner="${RUNNER_TEMP:-$PWD}/osv-scanner"
		curl -sSfL https://github.com/google/osv-scanner/releases/download/v2.3.8/osv-scanner_linux_amd64 \
			-o "$scanner"
		chmod +x "$scanner"
	fi
fi

json="$(mktemp)"
"$scanner" scan -L bun.lock -f json --output-file "$json" || true

high_count="$(
	python3 - "$json" <<'PY'
import json
import sys

data = json.load(open(sys.argv[1]))
count = 0
for result in data.get("results", []):
    for pkg in result.get("packages", []):
        for group in pkg.get("groups", []):
            raw = group.get("max_severity")
            if raw is None:
                continue
            try:
                if float(raw) >= 7.0:
                    count += 1
            except ValueError:
                if str(raw).upper() in {"HIGH", "CRITICAL"}:
                    count += 1
print(count)
PY
)"

if [ "$high_count" -gt 0 ]; then
	echo "::error::OSV-Scanner found $high_count high/critical vulnerability group(s)"
	exit 1
fi

echo "OSV-Scanner: no high/critical vulnerabilities"

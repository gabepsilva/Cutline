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
	bun -e "
const data = JSON.parse(await Bun.file(process.argv[1]).text());
let count = 0;
for (const result of data.results ?? []) {
	for (const pkg of result.packages ?? []) {
		for (const group of pkg.groups ?? []) {
			const raw = group.max_severity;
			if (raw == null) continue;
			const asNumber = Number(raw);
			if (!Number.isNaN(asNumber)) {
				if (asNumber >= 7) count += 1;
				continue;
			}
			const label = String(raw).toUpperCase();
			if (label === 'HIGH' || label === 'CRITICAL') count += 1;
		}
	}
}
console.log(count);
" "$json"
)"

if [ "$high_count" -gt 0 ]; then
	echo "::error::OSV-Scanner found $high_count high/critical vulnerability group(s)"
	exit 1
fi

echo "OSV-Scanner: no high/critical vulnerabilities"

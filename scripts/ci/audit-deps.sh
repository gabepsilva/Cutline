#!/usr/bin/env bash
# Fail CI when bun audit reports high or critical vulnerabilities.
# Parses `bun audit --json` rather than scraping human-readable output, so a
# change to bun's text formatting can't silently let the gate pass.
set -euo pipefail

# Human-readable summary for the CI log (bun audit exits non-zero on any finding).
bun audit || true

json="$(bun audit --json 2>/dev/null || true)"

high_count="$(
	printf '%s' "$json" | bun -e '
const text = await Bun.stdin.text();
const data = text.trim() ? JSON.parse(text) : {};
let count = 0;
// bun audit --json maps each package name to an array of advisories.
for (const advisories of Object.values(data)) {
	for (const advisory of advisories ?? []) {
		const sev = String(advisory.severity ?? "").toLowerCase();
		if (sev === "high" || sev === "critical") count += 1;
	}
}
console.log(count);
'
)"

if [ "${high_count:-0}" -gt 0 ]; then
	echo "::error::$high_count high/critical vulnerability advisory(ies) found — run 'bun audit' locally"
	exit 1
fi

echo "bun audit: no high/critical vulnerabilities"

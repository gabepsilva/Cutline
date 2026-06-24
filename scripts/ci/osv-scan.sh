#!/usr/bin/env bash
# Fail only on high/critical OSV findings (CVSS >= 7). Moderate/low are reported but not gated.
set -euo pipefail

# Pinned release + SHA256 of osv-scanner_linux_amd64. Bump both together when
# upgrading; the download is rejected if the digest does not match.
OSV_VERSION="v2.3.8"
OSV_SHA256="bc98e15319ed0d515e3f9235287ba53cdc5535d576d24fd573978ecfe9ab92dc"

scanner="${OSV_SCANNER_BIN:-}"
if [ -z "$scanner" ]; then
	if command -v osv-scanner >/dev/null 2>&1; then
		scanner="$(command -v osv-scanner)"
	else
		scanner="${RUNNER_TEMP:-$PWD}/osv-scanner"
		curl -sSfL "https://github.com/google/osv-scanner/releases/download/${OSV_VERSION}/osv-scanner_linux_amd64" \
			-o "$scanner"
		echo "${OSV_SHA256}  ${scanner}" | sha256sum --check --status \
			|| { echo "::error::osv-scanner checksum mismatch — refusing to run"; exit 1; }
		chmod +x "$scanner"
	fi
fi

json="$(mktemp)"
"$scanner" scan -L bun.lock -f json --output-file "$json" || true

high_count="$(
	bun -e "
const text = await Bun.file(process.argv[1]).text();
const data = text.trim() ? JSON.parse(text) : {};
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

if [ "${high_count:-0}" -gt 0 ]; then
	echo "::error::OSV-Scanner found $high_count high/critical vulnerability group(s)"
	exit 1
fi

echo "OSV-Scanner: no high/critical vulnerabilities"

#!/usr/bin/env bash
# Secret scanning for CI. Installs gitleaks into RUNNER_TOOL_CACHE (persistent per
# runner) so concurrent jobs on self-hosted runners do not race on /tmp/gitleaks.tmp
# — the failure mode of gitleaks/gitleaks-action when multiple runners share a host.
set -euo pipefail

GITLEAKS_VERSION="${GITLEAKS_VERSION:-8.24.3}"
GITLEAKS_TARBALL_SHA256="${GITLEAKS_TARBALL_SHA256:-9991e0b2903da4c8f6122b5c3186448b927a5da4deef1fe45271c3793f4ee29c}"
GITLEAKS_CONFIG="${GITLEAKS_CONFIG:-.gitleaks.toml}"

gitleaks_bin="${GITLEAKS_BIN:-}"
if [ -z "$gitleaks_bin" ]; then
	if command -v gitleaks >/dev/null 2>&1; then
		gitleaks_bin="$(command -v gitleaks)"
	else
		install_dir="${RUNNER_TOOL_CACHE:-${HOME}/.cache}/gitleaks/${GITLEAKS_VERSION}"
		gitleaks_bin="${install_dir}/gitleaks"
		if [ ! -x "$gitleaks_bin" ]; then
			mkdir -p "$install_dir"
			tmp="$(mktemp "${RUNNER_TEMP:-/tmp}/gitleaks.${GITLEAKS_VERSION}.XXXXXX.tar.gz")"
			trap 'rm -f "$tmp"' EXIT
			curl -sSfL \
				"https://github.com/zricethezav/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
				-o "$tmp"
			echo "${GITLEAKS_TARBALL_SHA256}  ${tmp}" | sha256sum --check --status \
				|| { echo "::error::gitleaks tarball checksum mismatch — refusing to run"; exit 1; }
			tar -xzf "$tmp" -C "$install_dir" gitleaks
			chmod +x "$gitleaks_bin"
			rm -f "$tmp"
			trap - EXIT
		fi
	fi
fi

log_opts() {
	case "${GITHUB_EVENT_NAME:-}" in
	pull_request)
		printf '%s..%s' "${GITHUB_PR_BASE_SHA:?}" "${GITHUB_PR_HEAD_SHA:?}"
		;;
	push)
		if [ "${GITHUB_EVENT_BEFORE:-}" = '0000000000000000000000000000000000000000' ]; then
			printf '%s' '--all'
		else
			printf '%s..%s' "${GITHUB_EVENT_BEFORE:?}" "${GITHUB_SHA:?}"
		fi
		;;
	schedule | workflow_dispatch)
		printf '%s' '--all'
		;;
	*)
		printf '%s' '--all'
		;;
	esac
}

opts="$(log_opts)"
echo "gitleaks ${GITLEAKS_VERSION}: scanning with log-opts=${opts}"

"$gitleaks_bin" detect \
	--source . \
	--config "$GITLEAKS_CONFIG" \
	--verbose \
	--log-opts="$opts"

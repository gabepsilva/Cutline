#!/usr/bin/env bash
# Run Vitest once (non-watch) with a hard wall-clock ceiling.
# Browser mode can stall after plugin/SSR errors while still printing passing tests;
# GitHub's step timeout is a backup — this fails faster with a clear message.
# Keep this below every caller's `timeout-minutes` so this clean error wins the race.
set -euo pipefail

TIMEOUT_SECS="${VITEST_CI_TIMEOUT_SECS:-120}"
ARGS=("$@")

if [ "${#ARGS[@]}" -eq 0 ]; then
	ARGS=(--run)
fi

set +e
timeout --foreground "${TIMEOUT_SECS}s" bun x vitest "${ARGS[@]}"
code=$?
set -e

if [ "$code" -eq 124 ]; then
	echo "::error::Unit tests exceeded ${TIMEOUT_SECS}s (vitest hung or stalled)." >&2
	exit 124
fi

exit "$code"

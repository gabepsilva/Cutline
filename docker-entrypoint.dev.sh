#!/bin/sh
# Dev compose entrypoint (#202): host bind-mount shadows image node_modules, so keep
# the named volume in sync with bun.lock before running the service command.
set -e

LOCK_HASH=$(md5sum bun.lock | cut -d' ' -f1)
MARKER=node_modules/.bun-lock-hash

if [ ! -f "$MARKER" ] || [ "$(cat "$MARKER")" != "$LOCK_HASH" ]; then
	bun install --frozen-lockfile --ignore-scripts
	echo "$LOCK_HASH" > "$MARKER"
fi

exec "$@"

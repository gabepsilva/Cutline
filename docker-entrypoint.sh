#!/bin/sh
# Container entrypoint (T-10): apply DB migrations, then start the SvelteKit server.
# Migrations are idempotent (drizzle tracks applied versions), so this is safe on
# every start, including the ephemeral SQLite used on Kubernetes.
set -eu

# 1Password operator mounts dotenv at /app/.env; Bun does not auto-load it for
# `bun /app/build/index.js`. Fill only unset vars so ConfigMap env wins (#129).
# shellcheck disable=SC1091
. /app/scripts/load-dotenv.sh
load_dotenv

echo "[entrypoint] applying database migrations..."
bun /app/scripts/migrate.mjs

echo "[entrypoint] starting Cutline on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec bun /app/build/index.js

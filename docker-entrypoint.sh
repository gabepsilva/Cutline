#!/bin/sh
# Container entrypoint (T-10): apply DB migrations, then start the SvelteKit server.
# Migrations are idempotent (drizzle tracks applied versions), so this is safe on
# every start, including the ephemeral SQLite used on Kubernetes.
set -eu

echo "[entrypoint] applying database migrations..."
bun /app/scripts/migrate.mjs

echo "[entrypoint] starting Cutline on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec bun /app/build/index.js

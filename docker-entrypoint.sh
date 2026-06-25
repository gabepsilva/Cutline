#!/bin/sh
# Container entrypoint (T-10): apply DB migrations, then start the SvelteKit server.
# Migrations are idempotent (drizzle tracks applied versions), so this is safe on
# every start, including the ephemeral SQLite used on Kubernetes.
set -eu

# Secrets arrive as /app/.env (k8s mounts the 1Password-synced Secret blob there;
# docker/compose can mount or --env-file it). Bun auto-loads .env from CWD (/app) for
# both commands below — no loader needed. Real env (ConfigMap) wins on conflicts.
echo "[entrypoint] applying database migrations..."
bun /app/scripts/migrate.mjs

echo "[entrypoint] starting Cutline on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec bun /app/build/index.js

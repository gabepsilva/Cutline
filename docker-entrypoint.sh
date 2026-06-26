#!/bin/sh
# Container entrypoint (T-10): start the SvelteKit server. Migrations run via the
# cutline-migrate k8s Job before each deploy (M7-01) — not on every pod start.
set -eu

# Secrets arrive as /app/.env (k8s mounts the 1Password-synced Secret blob there;
# docker/compose can mount or --env-file it). Bun auto-loads .env from CWD (/app) for
# the server below. Real env (ConfigMap) wins on conflicts.
echo "[entrypoint] starting Cutline on ${HOST:-0.0.0.0}:${PORT:-3000}"
exec bun /app/build/index.js

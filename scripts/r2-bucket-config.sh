#!/usr/bin/env bash
# Apply tracked CORS + lifecycle rules to the cutline-prod R2 bucket via Wrangler.
# Auth: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (from 1Password — never commit values).
# See docs/dev-setup.md for op-based invocation and debug commands.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUCKET="${R2_BUCKET:-cutline-prod}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
	echo "error: CLOUDFLARE_API_TOKEN is required (Cloudflare API token with R2 bucket-config permissions)" >&2
	exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
	echo "error: CLOUDFLARE_ACCOUNT_ID is required" >&2
	exit 1
fi

cd "$ROOT"

echo "Applying CORS policy to ${BUCKET}..."
bunx wrangler r2 bucket cors set "$BUCKET" --file infra/r2/cors.json -y

echo "Applying lifecycle rules to ${BUCKET}..."
bunx wrangler r2 bucket lifecycle set "$BUCKET" --file infra/r2/lifecycle.json -y

echo ""
echo "CORS policy:"
bunx wrangler r2 bucket cors list "$BUCKET"

echo ""
echo "Lifecycle rules:"
bunx wrangler r2 bucket lifecycle list "$BUCKET"

echo ""
echo "Done — ${BUCKET} CORS + lifecycle applied from infra/r2/*.json"

#!/usr/bin/env bash
# Verify cutline pod logs are queryable in Loki (tk8s / homelab).
# Prerequisites: Loki + Alloy deployed (argoCD-apps), kubectl context = tk8s.
set -euo pipefail

NAMESPACE="${LOKI_NS:-monitoring}"
CUTLINE_NS="${CUTLINE_NS:-cutline}"
LOKI_SVC="${LOKI_SVC:-loki-gateway}"
SINCE="${SINCE:-15m}"
LOCAL_PORT="${LOKI_LOCAL_PORT:-13100}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

require kubectl
require jq
require curl

cleanup() {
  if [[ -n "${PF_PID:-}" ]] && kill -0 "$PF_PID" 2>/dev/null; then
    kill "$PF_PID" 2>/dev/null || true
    wait "$PF_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Context: $(kubectl config current-context)"
echo "==> Loki gateway: ${LOKI_SVC}.${NAMESPACE}.svc.cluster.local"

kubectl -n "$NAMESPACE" port-forward "svc/${LOKI_SVC}" "${LOCAL_PORT}:80" >/dev/null 2>&1 &
PF_PID=$!
LOKI_BASE="http://127.0.0.1:${LOCAL_PORT}"

for _ in $(seq 1 20); do
  if curl -fsS "${LOKI_BASE}/loki/api/v1/status/buildinfo" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo "==> Loki API"
curl -fsS "${LOKI_BASE}/loki/api/v1/status/buildinfo" | jq -r '"OK: Loki " + .version + " (" + .branch + ")"'
echo ""

loki_query() {
  local query="$1"
  curl -fsS -G "${LOKI_BASE}/loki/api/v1/query_range" \
    --data-urlencode "query=${query}" \
    --data-urlencode "limit=3" \
    --data-urlencode "since=${SINCE}"
}

check_logs() {
  local label="$1"
  local query="$2"
  echo "==> ${label}"
  local json
  json="$(loki_query "$query")"
  local count
  count="$(echo "$json" | jq '[.data.result[].values[]?] | length')"
  if [[ "$count" -eq 0 ]]; then
    echo "FAIL: no log lines for query: ${query}" >&2
    echo "$json" | jq '.' >&2 || true
    return 1
  fi
  echo "OK: ${count} line(s) in last ${SINCE}"
  echo "$json" | jq -r '.data.result[0].values[-1][1]' | head -c 200
  echo ""
}

fail=0
check_logs "cutline web stdout" "{namespace=\"${CUTLINE_NS}\",container=\"cutline\"}" || fail=1
check_logs "cutline worker stdout" "{namespace=\"${CUTLINE_NS}\",container=\"worker\"}" || fail=1

echo "==> JSON field parse (service=cutline pino lines)"
json="$(loki_query "{namespace=\"${CUTLINE_NS}\",container=\"cutline\"} | json | service=\"cutline\"")"
if echo "$json" | jq -e '.data.result[0].values[0][1] | fromjson | .service == "cutline"' >/dev/null 2>&1; then
  echo "OK: pino JSON fields parse in Loki"
elif echo "$json" | jq -e '[.data.result[].values[]?] | length > 0' >/dev/null; then
  echo "OK: cutline web logs present (no structured pino line in sample — entrypoint/startup only is fine)"
else
  echo "WARN: could not confirm JSON parse — check Alloy loki.process stage" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Hints:"
  echo "  - Ensure argoCD-apps loki + alloy Applications are Synced/Healthy"
  echo "  - Ensure cutline-prod is deployed and pods are Running (LOG_ACCESS=true)"
  echo "  - Browse https://cutline.i.psilva.org/ (not /healthz) to generate access lines"
  exit 1
fi

echo ""
echo "All checks passed. Explore in Grafana: https://grafana.i.psilva.org → Cutline / Logs"
echo "Query by requestId: {namespace=\"cutline\"} | json | requestId=\"<uuid>\""

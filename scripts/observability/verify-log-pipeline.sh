#!/usr/bin/env bash
# Verify cutline pod logs are queryable in Loki (tk8s / homelab).
# Prerequisites: Loki + Alloy deployed (argoCD-apps), kubectl context = tk8s.
set -euo pipefail

NAMESPACE="${LOKI_NS:-monitoring}"
CUTLINE_NS="${CUTLINE_NS:-cutline}"
LOKI_SVC="${LOKI_SVC:-loki-gateway}"
SINCE="${SINCE:-15m}"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

require kubectl
require jq

loki_query() {
  local query="$1"
  kubectl -n "$NAMESPACE" run "loki-verify-$$" --rm -i --restart=Never \
    --image=curlimages/curl:8.12.1 --command -- \
    curl -fsS -G "http://${LOKI_SVC}/loki/api/v1/query_range" \
    --data-urlencode "query=${query}" \
    --data-urlencode "limit=3" \
    --data-urlencode "since=${SINCE}"
}

echo "==> Context: $(kubectl config current-context)"
echo "==> Loki gateway: ${LOKI_SVC}.${NAMESPACE}.svc.cluster.local"

echo "==> Ready probe"
kubectl -n "$NAMESPACE" run "loki-ready-$$" --rm -i --restart=Never \
  --image=curlimages/curl:8.12.1 --command -- curl -fsS "http://${LOKI_SVC}/ready"
echo ""

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

echo "==> JSON field parse (requestId / service)"
json="$(loki_query "{namespace=\"${CUTLINE_NS}\",container=\"cutline\"} | json | service=\"cutline\"")"
if echo "$json" | jq -e '.data.result[0].values[0][1] | fromjson | .service == "cutline"' >/dev/null; then
  echo "OK: pino JSON fields parse in Loki"
else
  echo "WARN: could not confirm JSON parse — check Alloy loki.process stage" >&2
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo ""
  echo "Hints:"
  echo "  - Ensure argoCD-apps loki + alloy Applications are Synced/Healthy"
  echo "  - Ensure cutline-prod is deployed and pods are Running"
  echo "  - Hit https://cutline.i.psilva.org/healthz to generate web logs"
  exit 1
fi

echo ""
echo "All checks passed. Explore in Grafana: https://grafana.i.psilva.org → Cutline / Logs"
echo "Query by requestId: {namespace=\"cutline\"} | json | requestId=\"<uuid>\""

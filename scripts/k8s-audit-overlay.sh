#!/usr/bin/env bash
# List namespace resources that are absent from a kustomize overlay render.
# Catches manual `kubectl apply` leftovers Argo CD prune will not remove (#218).
set -euo pipefail

usage() {
	echo "Usage: $0 <namespace> <overlay-path> [--delete]" >&2
	echo "  --delete  remove orphaned resources (prompts per kind/name)" >&2
	exit 1
}

DELETE=false
while [[ $# -gt 0 ]]; do
	case "$1" in
		--delete) DELETE=true ;;
		-h | --help) usage ;;
		-*) echo "Unknown option: $1" >&2; exit 1 ;;
		*)
			if [[ -z "${NAMESPACE:-}" ]]; then
				NAMESPACE="$1"
			elif [[ -z "${OVERLAY:-}" ]]; then
				OVERLAY="$1"
			else
				usage
			fi
			;;
	esac
	shift
done

[[ -n "${NAMESPACE:-}" && -n "${OVERLAY:-}" ]] || usage

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY_PATH="$ROOT/$OVERLAY"
[[ -d "$OVERLAY_PATH" ]] || {
	echo "error: overlay not found: $OVERLAY_PATH" >&2
	exit 1
}

# Kinds we manage via overlays (skip runtime-owned types like Pod/ReplicaSet).
MANAGED_KINDS=(
	ConfigMap
	Service
	Deployment
	CronJob
	Job
	Certificate
	Ingress
	OnePasswordItem
)

expected_file="$(mktemp)"
trap 'rm -f "$expected_file"' EXIT

kubectl kustomize "$OVERLAY_PATH" | awk '
  /^kind:/ { kind=$2 }
  /^  name:/ { if (kind != "" && kind != "Namespace") print tolower(kind) "/" $2; kind="" }
' | sort -u >"$expected_file"

orphans=()
for kind in "${MANAGED_KINDS[@]}"; do
	api_lower="$(echo "$kind" | tr '[:upper:]' '[:lower:]')"
	case "$kind" in
		OnePasswordItem) resource_flag="onepassworditems" ;;
		Ingress) resource_flag="ingresses" ;; # naive +s gives the invalid "ingresss"
		*) resource_flag="${api_lower}s" ;;
	esac
	while IFS= read -r name; do
		[[ -z "$name" || "$name" == "kube-root-ca.crt" ]] && continue
		key="${api_lower}/${name}"
		if ! grep -qxF "$key" "$expected_file"; then
			orphans+=("$resource_flag/$name")
		fi
	done < <(kubectl -n "$NAMESPACE" get "$resource_flag" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null || true)
done

if [[ ${#orphans[@]} -eq 0 ]]; then
	echo "OK: no orphaned resources in ${NAMESPACE} (overlay: ${OVERLAY})"
	exit 0
fi

echo "Orphaned resources in ${NAMESPACE} (not in ${OVERLAY}):"
printf '  %s\n' "${orphans[@]}"

if [[ "$DELETE" == true ]]; then
	for resource in "${orphans[@]}"; do
		read -rp "Delete ${NAMESPACE}/${resource}? [y/N] " reply </dev/tty || reply=""
		if [[ "$reply" =~ ^[Yy]$ ]]; then
			kubectl -n "$NAMESPACE" delete "$resource" --ignore-not-found
		else
			echo "Skipped ${resource}"
		fi
	done
	echo "Done."
fi

exit 1

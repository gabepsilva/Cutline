#!/usr/bin/env bash
# Create milestones M0–M6. Idempotent: skips milestones that already exist.
set -euo pipefail

REPO="${REPO:-gabepsilva/Cutline}"

declare -a MS=(
  "M0 — Test infrastructure|Shared test helpers, fixtures, coverage CI gates. Do first."
  "M1 — Foundation|Design tokens and shared UI primitives. No backend data required."
  "M2 — Layout shells|Sidebar, dashboard/editor layouts, timeline shell, modal shells."
  "M3 — Auth UI|Login/signup styled to match Cutline (better-auth)."
  "M4 — Dashboard (data-backed)|Dashboard wired to projects/session. Mocks allowed with TODO until backend lands."
  "M5 — Editor (data-backed)|Transcript, preview, transport wired. Mocks allowed with TODO."
  "M6 — Editor features (data-backed)|Timeline, media, export, recording, editing actions."
)

existing="$(gh api "repos/$REPO/milestones?state=all&per_page=100" --jq '.[].title')"

for entry in "${MS[@]}"; do
  title="${entry%%|*}"
  desc="${entry#*|}"
  if grep -Fxq "$title" <<<"$existing"; then
    echo "skip  (exists): $title"
  else
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" -f state=open --jq '"create: \(.title) (#\(.number))"'
  fi
done

#!/usr/bin/env bash
# Create/refresh the static label set for the Cutline UI build.
# Idempotent: `gh label create --force` updates color/description if it exists.
# Per-issue `pid:*` labels are created by create-issues.mjs, not here.
set -euo pipefail

REPO="${REPO:-gabepsilva/Cutline}"

label() { gh label create "$1" --color "$2" --description "$3" --force --repo "$REPO"; }

# Work type
label "ui"             "1f6feb" "Visual implementation"
label "design-system"  "8957e5" "Tokens, primitives, shared CSS"
label "layout"         "2da44e" "Shell / page structure"
label "component"      "5319e7" "Reusable Svelte component"
label "testing"        "fbca04" "Test infrastructure or coverage work"
label "deploy"         "006b75" "Container, Kubernetes, CD pipeline"
label "chore"          "ededed" "Cleanup / infra not tied to a design region"

# Screen area
label "screen:dashboard" "0e8a16" "Dashboard area from the design"
label "screen:editor"    "006b75" "Editor area from the design"

# Size
label "size:small"     "c5def5" "Single component, one file"
label "size:compose"   "bfdadc" "Thin route/page wiring only"

# Blocked
label "blocked:data"   "d73a4a" "Real backend/service not wired yet — mocks OK with TODO until closed"
label "blocked:auth"   "db6d28" "Needs auth integration"

# Tracking
label "epic"           "3e1f92" "Parent / tracking issue"
label "good-first-task" "7057ff" "Well-isolated size:small task"

echo "Static labels created/updated on $REPO."

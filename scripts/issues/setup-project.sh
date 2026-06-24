#!/usr/bin/env bash
# Create + sync the "Cutline UI" GitHub Project (v2) board.
#
# Requires the `project` token scope (one-time):
#   gh auth refresh -s project,read:project
#
# NOTE: `gh project create` is broken in gh 2.87.0 ("Variable $query is used by
# CreateProjectV2 but not declared"), so board creation goes through the GraphQL
# API in sync-board.mjs instead.
set -euo pipefail
exec node "$(dirname "$0")/sync-board.mjs" "$@"

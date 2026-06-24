# Issue creation loop

Turns the **`PLANNING.md` → "Issue inventory"** tables into GitHub issues. `PLANNING.md`
is the single source of truth for inventory, priority order, labels, and dependencies;
these scripts only create/label/link. Per-issue body enrichment (goal + scope bullets)
lives in `scope.json` so the plan never has to be edited to improve an issue.

## One-time setup (already run)

```sh
bash scripts/issues/setup-labels.sh        # static labels (ui, testing, blocked:data, …)
bash scripts/issues/setup-milestones.sh    # M0–M6
```

## Create issues

```sh
# Inspect parsed inventory in priority order (no writes):
node scripts/issues/create-issues.mjs --list

# Preview a body without creating anything:
node scripts/issues/create-issues.mjs --pids M1-04 --dry-run

# Refresh an already-created issue's title + body (e.g. after editing the plan/scope):
node scripts/issues/create-issues.mjs --pids T-00 --update

# The reviewed first batch (already created): epic + T-00 + M1-01
node scripts/issues/create-issues.mjs --epic --pids T-00,M1-01

# RELEASE THE REST once the format is approved:
node scripts/issues/create-issues.mjs --all

# Or a slice by priority order (1-indexed):
node scripts/issues/create-issues.mjs --from 4 --to 19
```

- **Idempotent:** skips any PID already in `pid-map.json` or already carrying its
  `pid:<ID>` label, so `--all` is safe to re-run.
- **Order = priority:** issues are created in inventory-table order (M0 → M6).
- `pid-map.json` records the PID → issue-number mapping (paste into the epic).

## After a full release

Dependencies are written as planning IDs (e.g. `Blocked by: M1-04 (#NN)`); IDs already
created are resolved to `#numbers` automatically. To backfill links once every issue
exists, re-run creation (idempotent) — bodies regenerate deps from the now-complete map,
or edit the epic's PID→# table from `pid-map.json`.

## Files

| File                  | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `create-issues.mjs`   | Parser + body composer + `gh` driver                                |
| `scope.json`          | Optional per-issue goal/scope enrichment                            |
| `setup-labels.sh`     | Static label set                                                    |
| `setup-milestones.sh` | Milestones M0–M6                                                    |
| `setup-project.sh`    | Thin wrapper → `sync-board.mjs`                                     |
| `sync-board.mjs`      | Create + sync the Project board, add issues, set status from labels |
| `pid-map.json`        | Generated PID → issue-number map                                    |

## GitHub Project board

Creating the **Cutline UI** board needs the `project` token scope. Grant it once,
then sync (idempotent — re-run after every issue release to add new issues):

```sh
gh auth refresh -s project,read:project
node scripts/issues/sync-board.mjs
```

`sync-board.mjs` creates the board if missing, sets the Status columns
(Backlog · Ready · In progress · Blocked · Done), adds every repo issue, and sets
each item's Status from labels (epic → In progress; `blocked:*` → Blocked; else Ready),
leaving already-set statuses untouched.

> Board creation uses the GraphQL API directly: `gh project create` is broken in
> gh 2.87.0 (`Variable $query is used by CreateProjectV2 but not declared`).

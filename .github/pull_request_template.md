## Closes

Closes #<issue>  ·  Planning-ID: `<PID>`

## What

<1–3 sentences: which design region/component, what this PR delivers>

## Design reference

- `design-by-claude/Cutline.dc.html` lines <range>

### Quality

- [ ] Matches design tokens (no hardcoded hex) — uses `src/lib/styles/tokens.css`
- [ ] Follows the Design → Svelte translation guide (BEM, clsx variants, keyed `{#each}`)
- [ ] `svelte-autofixer` clean on all changed `.svelte` files
- [ ] `bun run check` + `bun run lint` (prettier `--check` + eslint) pass
- [ ] Co-located tests added; `bun run test:unit -- --run` passes
- [ ] **Test quality review** boxes checked (see issue)
- [ ] Coverage meets milestone target on changed lines (or `N/A (pre-T-01)` if merged before the coverage gate lands)
- [ ] File within size limits; split if needed
- [ ] a11y: interactive elements are `<button>`/`<a>` with labels

### Security & supply chain

- [ ] No secrets/credentials/tokens committed (`.env`, keys) — secret scan passes
- [ ] New/updated dependencies are necessary, reputable, and pass `bun audit` + dependency review
- [ ] No new high-severity CodeQL alerts introduced
- [ ] Any new GitHub Action is pinned to a commit SHA; workflow uses least-privilege `permissions`
- [ ] No untrusted input flows to `eval`, HTML sinks, shell, or SQL without sanitization

### Merge readiness

- [ ] Rebased on `master`; all required CI checks green
- [ ] No merge of mocks claimed as "wired" (unless UI-only)

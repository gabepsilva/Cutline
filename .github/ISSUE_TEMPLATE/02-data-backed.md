---
name: "Data-backed issue (Template B)"
about: "Wire a feature/route to real server data (M4 / M5 / M6)."
title: "<PID>: wire <feature> to data"
labels: ["blocked:data"]
---

> **Planning-ID:** `<PID>`  ·  **Milestone:** `<Mn>`
> **Read first** in `PLANNING.md`: Agent runbook & conventions · Design → Svelte translation guide · Design tokens reference · Shared type contracts · Reading the design file
> **Design source:** `design-by-claude/Cutline.dc.html` (lines `<range>`)
> **Blocked by:** `<PIDs → map to #NN before starting>`

## Goal

Wire <feature> to real server data.

## Design reference

- File: `design-by-claude/Cutline.dc.html`
- Lines: <line range>

## Data required

- [ ] <table / API>
- [ ] User session

## Target files

- `src/routes/.../+page.server.ts` + `+page.server.spec.ts`
- `src/routes/.../+page.svelte` (composition only, ~50–80 lines)
- `src/routes/.../<flow>.e2e.ts` (if user-facing flow)

## Out of scope

- Undocumented hardcoded data in components
- Closing issue as "wired" while `src/lib/mocks/` still feeds this route

## Mock data (if backend not ready)

- [ ] `+page.server.ts` imports from `$lib/mocks/*` with `MOCK` + `TODO(backend)` comments
- [ ] Issue remains open (or sub-issue created) until real drizzle/API replaces mock

## Tests to write

| Layer | File | Asserts |
|-------|------|---------|
| Server | `+page.server.spec.ts` | Test DB / mocked drizzle: empty DB → `[]`; seeded DB → correct shape; unauthorized → redirect/error |
| Page | `+page.svelte.spec.ts` (optional) | Correct child components receive loaded props |
| E2E | `<flow>.e2e.ts` | Authenticated user sees empty state OR real seeded data — never hardcoded placeholder |

## Test quality review (required before merge)

- [ ] **Traceability:** Each test maps to a row in **Tests to write** or acceptance criteria
- [ ] **Failure test:** Removing `load` logic or empty-state branch breaks at least one test
- [ ] **DB realism:** Server tests use test DB seed or drizzle mock matching production schema
- [ ] **Empty path covered:** Test empty result separately from mock-populated dev load
- [ ] **Auth path covered:** Unauthorized / logged-out behavior tested where applicable
- [ ] **E2E uses real flow:** Login → navigate → assert DOM — not `page.setContent('<div>fake</div>')`
- [ ] **No hollow assertions:** No tests that only check HTTP 200 without body/shape
- [ ] **Coverage:** `+page.server.ts` ≥ 85% lines on changed code (or `N/A (pre-T-01)`)
- [ ] **Reviewer sign-off:** Tests would catch a data regression for this route

## Acceptance criteria

- [ ] `load` returns real DB data **or** documented mocks with TODOs (UI phase only)
- [ ] Empty state when result is empty — uses `EmptyState` (M1-13)
- [ ] Route page is thin composition only
- [ ] All tests pass; test quality review checked
- [ ] If mocks used: linked follow-up or same issue open until `TODO` resolved
- [ ] PR links to this issue

## Depends on

- Blocked by: #NN (schema), #NN (components)

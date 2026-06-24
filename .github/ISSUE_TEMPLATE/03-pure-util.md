---
name: "Pure util / state (Template C)"
about: "Implement a pure function or state class with full unit coverage (e.g. M1-11, M5-00, M6-10)."
title: "<PID>: <function | EditorState method>"
labels: ["size:small"]
---

> **Planning-ID:** `<PID>`  ·  **Milestone:** `<Mn>`
> **Read first** in `PLANNING.md`: Agent runbook & conventions · Shared type contracts
> **Design source:** `design-by-claude/Cutline.dc.html` (lines `<range>`)
> **Blocked by:** `<PIDs → map to #NN before starting>`

## Goal

Implement `<function | EditorState method>` with full unit coverage.

## Target files

- `src/lib/.../<name>.ts` (or `.svelte.ts` for stateful)
- `src/lib/.../<name>.spec.ts`

## Tests to write (table-driven)

| Case | Input | Expected |
|------|-------|----------|
| initial / normal | — | <expected> |
| boundary | <edge input> | <expected> |
| invalid input | <bad input> | <graceful behavior> |

## Test quality review (required before merge)

- [ ] **Edge cases:** At least one test per public function for normal + boundary input
- [ ] **Failure test:** Wrong formula / wrong math fails tests
- [ ] **No DOM:** Node-environment tests — logic only
- [ ] **Coverage:** ≥ target for the area (or `N/A (pre-T-01)`)
- [ ] **Reviewer sign-off:** Tests document expected behavior as living spec

## Acceptance criteria

- [ ] `<name>.spec.ts` passes (`bun run test:unit -- --run`)
- [ ] No `$effect` that mutates state for derived values — use `$derived`
- [ ] Test quality review checked
- [ ] PR links to this issue

## Depends on

- Blocked by: #NN

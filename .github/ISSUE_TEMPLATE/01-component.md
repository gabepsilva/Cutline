---
name: "Component issue (Template A)"
about: "Implement a presentational Svelte 5 component from the Claude design (M1 / M2 / M5 UI)."
title: "<PID>: <ComponentName> component"
labels: ["ui"]
---

> **Planning-ID:** `<PID>`  ·  **Milestone:** `<Mn>`
> **Read first** in `PLANNING.md`: Agent runbook & conventions · Design → Svelte translation guide · Design tokens reference · Shared type contracts · Reading the design file
> **Design source:** `design-by-claude/Cutline.dc.html` (lines `<range>`)
> **Blocked by:** `<PIDs → map to #NN before starting>`

## Goal

Implement `<ComponentName>` from the Claude design as a presentational Svelte 5 component.

## Design reference

- File: `design-by-claude/Cutline.dc.html`
- Section: <describe section>
- Lines: <line range>

## Target files

- `src/lib/components/.../ComponentName.svelte`
- `src/lib/components/.../ComponentName.svelte.spec.ts` **(required, same PR)**

## Scope

- <bullet list of what is included>

## Out of scope

- Undocumented hardcoded data (no comment / no TODO)
- Backend wiring marked done while mocks remain (unless issue is explicitly UI-only)

## Mock data (if backend not ready)

- [ ] Mocks live in `src/lib/mocks/`, not inside the component
- [ ] Each mock file/block has `// MOCK:` explanation
- [ ] Each has `TODO(data|backend|service|3p):` with target issue or integration
- [ ] Components still receive data via props only

## Svelte checklist (AGENTS.md)

- [ ] **Svelte MCP:** `svelte-autofixer` run on changed `.svelte` files — no issues/suggestions remaining
- [ ] `$props()` with typed props
- [ ] BEM class names
- [ ] File within size target; split if needed
- [ ] `{#snippet}` / `{@render}` for slots where applicable
- [ ] Keyed `{#each}` if rendering lists
- [ ] Interactive elements use `<button>` / `<a>` with a11y labels

## Tests to write

| Test | Asserts (behavior, not implementation) |
|------|----------------------------------------|
| renders default state | Specific visible text, role, or structure from design |
| variant / prop | Output changes when prop changes (e.g. `disabled`, `selected`) |
| user interaction | `click` / `keyboard` → callback fired or DOM updates |
| a11y | Correct role, `aria-*`, focusable, labelled control |
| empty / null props | Graceful hide or empty state — no crash |

Use fixtures from `src/lib/test/fixtures/` when props need domain objects.

## Test quality review (required before merge)

> **Purpose:** Confirm tests exercise real product behavior — not placeholders that pass without protecting quality.

- [ ] **Traceability:** Each `it(...)` maps to a row in **Tests to write** or an acceptance criterion below
- [ ] **Failure test:** If the feature were removed, at least one test would fail
- [ ] **No hollow assertions:** No `expect(true).toBe(true)`, no-only `toBeDefined()` / `toBeTruthy()` on mount without checking output
- [ ] **No implementation coupling:** Tests do not import private state, `$state` internals, or CSS module hashes
- [ ] **Real interactions:** User actions use `click`, `fill`, `keyboard` — not direct handler invocation unless unit-testing a pure helper
- [ ] **Meaningful fixtures:** Component tests use `src/lib/test/fixtures/*`; production mocks use `src/lib/mocks/*` only in routes/load
- [ ] **No mock-the-world:** Only mock browser APIs or server when unavoidable; do not mock the component under test
- [ ] **Coverage:** New/changed lines meet milestone target (or `N/A (pre-T-01)` if merged before the coverage gate lands)
- [ ] **Reviewer sign-off:** Tests would catch a regression in this component's scope

## Acceptance criteria

- [ ] Component matches design tokens (M1-01)
- [ ] Presentational: props in, callbacks out
- [ ] Co-located `ComponentName.svelte.spec.ts` passes (`bun run test:unit -- --run`)
- [ ] Test quality review checkboxes all checked
- [ ] PR links to this issue

## Depends on

- Blocked by: #NN

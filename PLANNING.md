# Cutline UI — Implementation Plan

Plan for implementing the Claude design (`design-by-claude/`) as structured Svelte 5 components. Intended for team-lead review before creating GitHub issues and project board.

**Design source:** `design-by-claude/Cutline.dc.html`  
**Repo:** [gabepsilva/Cutline](https://github.com/gabepsilva/Cutline)  
**Conventions:** See `AGENTS.md` (BEM, Svelte 5 runes, file size limits, no giant files)

---

## Table of contents

1. [Implementation principles](#implementation-principles)
2. [Svelte implementation standards](#svelte-implementation-standards)
3. [Testing strategy](#testing-strategy)
4. [GitHub setup](#github-setup)
5. [Milestones](#milestones)
6. [Issue inventory](#issue-inventory)
7. [Dependency graph](#dependency-graph)
8. [Target folder structure](#target-folder-structure)
9. [Design → component map](#design--component-map)
10. [Issue templates](#issue-templates)
11. [Suggested sprint order](#suggested-sprint-order)
12. [Out of scope (for now)](#out-of-scope-for-now)
13. [Design → Svelte translation guide](#design--svelte-translation-guide)
14. [Design tokens reference (extracted)](#design-tokens-reference-extracted)
15. [Shared type contracts](#shared-type-contracts)
16. [Concurrency & file ownership](#concurrency--file-ownership)
17. [GitHub issue mechanics (planning ID → number)](#github-issue-mechanics-planning-id--number)
18. [Agent runbook & conventions](#agent-runbook--conventions)
19. [Reading the design file](#reading-the-design-file)

---

## Implementation principles

These rules apply to every issue and PR.

### Agents must use Svelte MCP

All Svelte implementation follows **`AGENTS.md` → Agent requirements — Svelte MCP**. Every `.svelte` PR: `svelte-autofixer` clean before merge. Issue acceptance criteria should include this for component issues.

### UI only from design

- `design-by-claude/` is reference only — do not ship it in production routes.
- The design is a **React/`DCLogic` prototype** (`sc-if`, `sc-for`, inline styles), **not** Svelte. Every issue translates it — follow the [Design → Svelte translation guide](#design--svelte-translation-guide) so all agents produce one consistent dialect.
- Use the [Design tokens reference](#design-tokens-reference-extracted) and [Shared type contracts](#shared-type-contracts) as the single source of truth — never hardcode hex values or re-invent prop shapes.
- Implement visual structure, styling, and interaction shells that match the design.
- Wire to real data via SvelteKit `load` when schemas/APIs exist; until then use documented mocks (see below).

### Mock data (temporary)

Mock data is **allowed** to build UI before backends exist. Rules (see also `AGENTS.md`):

- Comment every mock: what it simulates and that it is temporary.
- Add a `TODO` on each mock: `TODO(data)`, `TODO(backend)`, `TODO(service)`, or `TODO(3p)` — what replaces it.
- Centralize in `src/lib/mocks/` — avoid inline fake arrays in components.
- Components accept **props**; pages/`load` inject mock or real data.
- **Tests** use `src/lib/test/fixtures/` only — not `src/lib/mocks/`.

An issue labelled `blocked:data` means **real integration is still required to close the issue** — but UI work may ship earlier using documented mocks with TODOs.

### Small, organized files

Follow `AGENTS.md` file size guidelines:

| File type             | Target         | Hard ceiling |
| --------------------- | -------------- | ------------ |
| Route `+page.svelte`  | ~50–80 lines   | ~120 lines   |
| Leaf UI component     | ~80–150 lines  | ~250 lines   |
| Layout / orchestrator | ~60–100 lines  | ~150 lines   |
| Complex widget        | ~100–200 lines | ~300 lines   |
| `.ts` utils / types   | ~100–200 lines | ~300 lines   |

- One primary component per file.
- Pages compose components — no large markup blocks in routes.
- Split by visual region from the design (sidebar, top bar, transcript row, modal step).
- One issue ≈ one PR ≈ one component (or a tiny related pair, e.g. `Button` + `IconButton`).

### Design screens overview

The Claude prototype contains two main screens and several overlays:

| Screen / overlay | Design marker (HTML comment)                             | Lines (approx.) |
| ---------------- | -------------------------------------------------------- | --------------- |
| Dashboard        | `<!-- ================= DASHBOARD ================= -->` | 30–108          |
| Editor           | `<!-- ================= EDITOR ================= -->`    | 110–506         |
| Media shelf      | `showMedia` overlay                                      | 352–380         |
| Record modal     | `showRecord` overlay                                     | 382–448         |
| Export modal     | `showExport` overlay                                     | 450–503         |

Global tokens and styles live in the `<helmet>` block (lines 10–25) and root wrapper (line 28).

---

## Svelte implementation standards

Every issue must follow `AGENTS.md`. In addition:

### Component API

- Use `$props()` with typed props interfaces (co-locate in `ComponentName.types.ts` when non-trivial).
- Emit user actions via callback props (`onclick`, `onclose`, `onseek`) — not bespoke event buses.
- Use `{#snippet}` / `{@render}` for layout slots (`DashboardLayout`, `EditorLayout`, `Modal`).
- Use keyed `{#each}` with stable IDs (`project.id`, `word.id`) — never index keys.

### Reactivity

- Prefer `$derived` / `$derived.by` for computed UI (timecode, playhead %, caption words, filler count).
- Use `$state` only for local UI state (modal open, search query).
- Use `$state.raw` for large server payloads reassigned from `load`.
- Do **not** update state inside `$effect` except for rare DOM sync (e.g. `bind:this` on `<video>`).

### Editor state (M5+)

Playback, selection, and playhead are shared across transcript, preview, transport, and timeline. Do not duplicate this state in sibling components.

**Deliverable:** `src/lib/editor/editor-state.svelte.ts` — class with `$state` fields (`currentTime`, `playing`, `selectedWordId`, etc.) and methods (`togglePlay`, `seek`, `selectWord`). Editor route owns one instance; children receive it via prop or context.

Issue **M5-00** must land before M5-11 and M6-03.

### Accessibility

- Interactive controls use `<button>` or `<a>` — not clickable `<div>` (unless documented exception with `role`, `tabindex`, keyboard handler).
- Modals: `aria-modal="true"`, focus trap, Escape to close, labelled title.
- Transport: `aria-label` on play / pause / skip.
- Search fields: visible or `aria-label` associated with `<input>`.
- Issue **M1-14** defines shared a11y patterns for `ui/`.

### Domain types

Shared types live in `src/lib/types/` — not inside `.svelte` files. Create when schema/API lands:

| File            | Issue | When                        |
| --------------- | ----- | --------------------------- |
| `project.ts`    | M4-00 | Projects schema merged      |
| `transcript.ts` | M5-00 | Transcript schema merged    |
| `media.ts`      | M6-00 | Media library schema merged |
| `timeline.ts`   | M6-00 | Timeline model merged       |

---

## Testing strategy

High test coverage is a **merge requirement**, not optional polish. Tests ship in the **same PR** as the component, util, or route they cover.

### Tooling (already in repo)

| Layer                        | Tool                             | File pattern                                 | Environment        |
| ---------------------------- | -------------------------------- | -------------------------------------------- | ------------------ |
| Svelte components            | Vitest + `vitest-browser-svelte` | `src/**/*.svelte.spec.ts`                    | Browser (Chromium) |
| Pure TS (utils, state, load) | Vitest                           | `src/**/*.spec.ts` (excl. `.svelte.spec.ts`) | Node               |
| Routes / flows               | Playwright                       | `src/**/*.e2e.ts`                            | Browser            |

Run: `bun run test:unit` (unit + component), `bun run test:e2e` (Playwright).

`vite.config.ts` sets `expect: { requireAssertions: true }` — every test must assert something meaningful.

### Coverage targets

Enforce in CI (issue **T-01**):

| Area                                             | Line coverage target |
| ------------------------------------------------ | -------------------- |
| `src/lib/utils/**`                               | **≥ 95%**            |
| `src/lib/editor/**` (state, pure helpers)        | **≥ 90%**            |
| `src/lib/components/ui/**`                       | **≥ 85%**            |
| `src/lib/components/**` (all other)              | **≥ 80%**            |
| `src/routes/**` `+page.server.ts` / `+server.ts` | **≥ 85%**            |
| **Overall** `src/lib/**`                         | **≥ 80%**            |

Coverage gaps need justification in the PR (e.g. browser-only media APIs). Prefer extracting testable pure functions over skipping tests.

### What to test per issue type

| Issue type                                               | Required tests                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **UI primitive** (Button, Modal, Toggle)                 | Render variants; click / keyboard; disabled state; a11y roles and labels; open/close for Modal          |
| **Layout shell**                                         | Renders with empty props or documented mocks from parent; slots/snippets render children                |
| **Presentational feature** (ProjectCard, TranscriptWord) | Renders from typed fixture; key props change output; callbacks fire on interaction; empty/missing props |
| **Pure util** (`format-timecode`)                        | Table-driven edge cases (0, 59s, 60s, large values); invalid input handling                             |
| **EditorState**                                          | seek, play/pause, select word, derived timecode — no DOM                                                |
| **Server `load`**                                        | Returns shape; empty DB → empty arrays; auth gate; errors — use test DB or mocked drizzle               |
| **Route page**                                           | Thin composition: minimal test that correct child components mount with loaded data                     |
| **E2E flow**                                             | Auth login; home empty state; editor open project — critical paths only                                 |

### Test file layout

Co-locate tests next to source:

```text
Button.svelte
Button.svelte.spec.ts
format-timecode.ts
format-timecode.spec.ts
```

Shared fixtures: `src/lib/test/fixtures/` (typed minimal objects matching real API shapes — **not** empty `{}`).

Helpers: `src/lib/test/render.ts` — wrapper around `vitest-browser-svelte` `render` with global styles imported.

### Test quality bar

Every PR must pass the **Test quality review** checklist in the issue template (below). Reviewers reject tests that:

- Only assert the component rendered without checking behavior
- Would still pass if the feature were deleted
- Duplicate the same assertion across multiple tests
- Use meaningless fixtures unrelated to real domain shapes

---

## CI/CD pipeline (quality · security · supply chain · deploy to Kubernetes)

**Phase 0 of the build — land before any component work.** Every PR to `master` must
pass all gates below; `master` is branch-protected to require them (T-09). Each concern
is a small, independently reviewable workflow/issue (T-00, T-01, T-05–T-12) rather than
one monolithic pipeline.

**Production target:** the app runs on the homelab **`tk8s`** cluster as a container
(Deployment in namespace `cutline`), exposed at **`https://cutline.i.psilva.org`** via
nginx ingress + cert-manager TLS. CD is `kubectl set image` from the self-hosted runner
after merge to `master` (pattern: `jpegs3/.github/workflows/build-WEBSITE.yml`) — not
Fly/Vercel/serverless. Manifests live in `infra/k8s/` (kustomize).

**Hardening rules for every workflow:**

- **Runner:** all jobs run on the **self-hosted runner** — `runs-on: [self-hosted, Linux, X64]`
  (runner `cutline-runner-1`). Do **not** use GitHub-hosted runners. Because the runner is
  persistent: don't assume a clean VM (clean the workspace, pin tool versions), and **restrict
  self-hosted execution to trusted PRs** (same-repo/org, not forks) — running untrusted fork PRs
  on a self-hosted runner is arbitrary code execution on our infra. Gate fork PRs to a hosted
  runner or require maintainer approval before they run.
- Least-privilege `permissions:` — default `contents: read`; grant `security-events: write`,
  `id-token: write`, etc. only to the job that needs it.
- **Pin all third-party Actions to a full commit SHA** (not `@v4`) — supply-chain integrity.
- `concurrency` with `cancel-in-progress` per ref; `timeout-minutes` on every job.
- Bun via `oven-sh/setup-bun`; `bun install --frozen-lockfile` (no lockfile drift).
- Cache Bun store + Playwright browsers.

### Stage 1 — Code quality gates (T-00)

`.github/workflows/ci.yml`, on `pull_request` + `push: master`:

1. `bun install --frozen-lockfile`
2. `prettier --check .` (`bun run format` is write — use `--check` in CI)
3. `eslint .` (`bun run lint`)
4. `bun run check` — `svelte-check` + `tsc`, **zero errors**
5. `bun run test:unit -- --run` — Vitest `client` (browser/Chromium) + `server` projects
6. `bun run test:e2e` — Playwright (`playwright install --with-deps chromium`)

Fail fast on any non-zero exit. These are the required "good code / code quality" checks.

### Stage 2 — Coverage gate (T-01)

Adds `@vitest/coverage-v8` + `test.coverage` thresholds (provider `v8`, reporters
`text`/`html`/`lcov`, per-area thresholds from [Testing strategy](#testing-strategy));
aggregate across `client` + `server`. PR fails below threshold. (N/A for PRs merged before
T-01 is green — see T-01 note.)

### Stage 3 — Safe code: secret scanning (T-05)

- **gitleaks** action on PR + push; scheduled **full-history** scan.
- Enable repo **secret scanning** + **push protection** (Settings → Code security).
- Fail on any detected credential; document allowlist in `.gitleaks.toml`.

### Stage 4 — Safe code: dependencies & supply chain (T-06)

- `bun audit` — fail on **high/critical** (fallback/augment: `google/osv-scanner` for
  transitive coverage).
- `actions/dependency-review-action` on PRs — block known-vulnerable deps + disallowed licenses.
- `.github/dependabot.yml` — weekly updates for the npm/bun ecosystem **and** GitHub Actions.
- Pin Actions to SHAs (audit with `zizmor`); verify `bun.lock` committed + frozen everywhere.

### Stage 5 — Safe code: static analysis / SAST (T-07)

- GitHub **CodeQL** (`github/codeql-action`), language `javascript-typescript`,
  `security-extended` query suite.
- On PR + weekly schedule; results in the **Security** tab; PR fails on new high-severity alerts.

### Stage 6 — Safe binaries: build, SBOM, scan, provenance (T-08)

- `bun run build` must succeed; upload build output as a CI artifact (retention-limited).
- Generate an **SBOM** (CycloneDX — `@cyclonedx/cyclonedx-npm` or `anchore/sbom-action`) and attach it.
- **Trivy** scan (filesystem + config/misconfig) — fail on high/critical.
- Container/release path (when a `Dockerfile` or release artifact exists): scan the image with
  Trivy, emit **build-provenance attestation** (`actions/attest-build-provenance`), and verify
  before deploy. Feeds **Stage 8** (T-10–T-12): Kubernetes rollout on `tk8s`.

### Stage 7 — Repo hardening (T-09)

- PR template (`.github/pull_request_template.md`) with quality + security checklist.
- `.github/CODEOWNERS` for required-review routing.
- **Branch protection** on `master`: require PR, ≥1 approving review, all status checks above
  green, up-to-date + linear history, no force-push, dismiss stale approvals. (Set via repo
  settings / API; document exact required-check names in the issue once workflow job names are final.)

### Stage 8 — Container deploy to Kubernetes (T-10–T-12)

**Land after T-08 (build gate) is green.** Delivers a containerized SvelteKit app on the
`tk8s` cluster at **`https://cutline.i.psilva.org`** via nginx ingress + cert-manager TLS.
Follow the same patterns as `jpegs3` (GHCR image + `kubectl set image` CD on the self-hosted
runner) and `homelab7` / `image-works` (ingress, Certificate, hardened Deployment).

**Out of scope for this stage:** persistent database, GitHub OAuth / SSO, Argo CD GitOps
(can add later — start with direct `kubectl` rollout from CI like `jpegs3/.github/workflows/build-WEBSITE.yml`).

**Hardening rules (same as other workflows):** self-hosted runner for trusted refs only;
SHA-pinned Actions; least-privilege `permissions`; `concurrency` per ref.

1. **T-10 — Containerize:** `@sveltejs/adapter-node`, multi-stage `Dockerfile`, `.dockerignore`,
   `GET /healthz` for probes, enable Trivy **image** scan in `build.yml`.
2. **T-11 — K8s manifests:** `infra/k8s/` namespace `cutline`, Deployment, Service, Ingress
   (`cutline.i.psilva.org`), cert-manager `Certificate`, ConfigMap/Secret stubs. Ephemeral SQLite
   (`emptyDir` or `/tmp`) is fine until a real DB lands.
3. **T-12 — CD workflow:** `.github/workflows/deploy.yml` — build + push `ghcr.io/gabepsilva/cutline`,
   `kubectl set image` + rollout status, verify `https://cutline.i.psilva.org/healthz` via ingress IP.

---

## GitHub setup

### Project board

**Name:** `Cutline UI`  
**Template:** Board  
**Link:** All issues below should be added to this project.

| Column          | Purpose                                      |
| --------------- | -------------------------------------------- |
| **Backlog**     | Not started                                  |
| **Ready**       | Unblocked, can be assigned                   |
| **In progress** | Active work                                  |
| **Blocked**     | Waiting on data, schema, or dependency issue |
| **Done**        | Merged to main                               |

### Labels

Create these labels on the repo:

| Label              | Suggested color | Meaning                                                              |
| ------------------ | --------------- | -------------------------------------------------------------------- |
| `ui`               | Blue            | Visual implementation                                                |
| `design-system`    | Purple          | Tokens, primitives, shared CSS                                       |
| `layout`           | Green           | Shell / page structure                                               |
| `component`        | —               | Reusable Svelte component                                            |
| `screen:dashboard` | —               | Dashboard area from design                                           |
| `screen:editor`    | —               | Editor area from design                                              |
| `size:small`       | —               | Single component, one file                                           |
| `size:compose`     | —               | Thin route/page wiring only                                          |
| `blocked:data`     | Red             | Real backend/service not wired yet — mocks OK with TODO until closed |
| `blocked:auth`     | Orange          | Needs auth integration                                               |
| `testing`          | Yellow          | Test infrastructure or coverage work                                 |
| `deploy`           | Teal            | Container image, Kubernetes manifests, CD workflow                   |
| `epic`             | —               | Parent / tracking issue                                              |

### Epic (parent issue)

Create one epic issue to group all work:

**Title:** Epic: Implement Claude design in Svelte  
**Labels:** `epic`, `ui`  
**Body:** Link to this `PLANNING.md`, design file path, and list milestone links as child issues are created.

---

## Milestones

### M0 — Test infrastructure & deploy

Shared test helpers, fixtures, coverage CI gates, and **Kubernetes deploy** (T-10–T-12).
**Do first** alongside M1-01. Production URL: `https://cutline.i.psilva.org`.

### M1 — Foundation

Design tokens and shared UI primitives. **No backend data required.** All issues start in **Ready**.

### M2 — Layout shells

Sidebar, dashboard layout, editor layout, timeline shell, modal shells. May use empty props or route-level mocks (see Mock data policy). **No backend required to start.**

### M3 — Auth UI

Login/signup styled to match Cutline. Uses existing better-auth setup. **No project data required.**

### M4 — Dashboard (data-backed)

UI may use `src/lib/mocks/*` until schema/API lands. Close each issue only after real `load` / session wiring and mocks removed.

### M5 — Editor (data-backed)

Same as M4 — mocks for transcript, video URL, etc. allowed with `TODO` comments until APIs exist.

### M6 — Editor features (data-backed)

Mocks allowed for timeline, media, export jobs, recording — each with `TODO(backend)` / `TODO(3p)` as appropriate.

---

## Issue inventory

Issue IDs below (`M1-01`, etc.) are planning IDs for the team lead — map them to GitHub issue numbers when created. Each row is **one GitHub issue**.

Legend: **Status** = `ready` | `blocked:data` | `blocked:auth`  
**Tests** = co-located test file(s) required in same PR.

---

### M0 — Test infrastructure

Order = priority. The **CI/CD, safety, and Kubernetes deploy foundation (T-00, T-01, T-05–T-12)
lands first** before any component issue — see the
[CI/CD pipeline](#cicd-pipeline-quality--security--supply-chain--deploy-to-kubernetes)
section for the detailed steps each issue implements.

| ID   | Title                                                                                         | Labels    | Target file(s)                                                                                                                                | Status | Depends on                         |
| ---- | --------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| T-00 | **CI: code-quality gates** (format, lint, `svelte-check`/tsc, unit+component, e2e)            | `testing` | `.github/workflows/ci.yml`                                                                                                                    | ready  | —                                  |
| T-01 | CI: coverage thresholds (`vitest --coverage`)                                                 | `testing` | `vite.config.ts`, `.github/workflows/ci.yml`, `package.json`                                                                                  | ready  | T-00                               |
| T-05 | CI: secret scanning (gitleaks + push protection)                                              | `testing` | `.github/workflows/security.yml`, `.gitleaks.toml`                                                                                            | ready  | T-00                               |
| T-06 | CI: dependency & supply-chain security (audit, dependency-review, Dependabot, pinned actions) | `testing` | `.github/workflows/security.yml`, `.github/dependabot.yml`                                                                                    | ready  | T-00                               |
| T-07 | CI: static analysis (CodeQL, JS/TS)                                                           | `testing` | `.github/workflows/codeql.yml`                                                                                                                | ready  | T-00                               |
| T-08 | CI: build verification + SBOM + scan (safe binaries)                                          | `testing` | `.github/workflows/build.yml`                                                                                                                 | ready  | T-00                               |
| T-09 | Repo hardening: PR template + CODEOWNERS + branch protection / required checks                | `testing` | `.github/pull_request_template.md`, `.github/CODEOWNERS`                                                                                      | ready  | T-00, T-01, T-05, T-06, T-07, T-08 |
| T-10 | Containerize app (`adapter-node`, Dockerfile, `/healthz`)                                     | `deploy`  | `Dockerfile`, `.dockerignore`, `docker-entrypoint.sh`, `vite.config.ts`, `scripts/migrate.mjs`, `drizzle/**`, `src/routes/healthz/+server.ts` | ready  | T-08                               |
| T-11 | Kubernetes manifests + ingress (`cutline.i.psilva.org`)                                       | `deploy`  | `infra/k8s/**`                                                                                                                                | ready  | T-10                               |
| T-12 | CD: build image, push GHCR, `kubectl` rollout + route verify                                  | `deploy`  | `.github/workflows/deploy.yml`                                                                                                                | ready  | T-10, T-11                         |
| T-02 | Test helpers + global styles in component tests                                               | `testing` | `src/lib/test/render.ts`, `src/lib/test/setup.ts`                                                                                             | ready  | M1-01, M1-02                       |
| T-03 | Domain fixtures package (typed, minimal, realistic)                                           | `testing` | `src/lib/test/fixtures/*.ts`                                                                                                                  | ready  | T-02                               |
| T-04 | E2E smoke: app boots + shells route                                                           | `testing` | `src/routes/demo/shells/shells.e2e.ts`                                                                                                        | ready  | M2-23, T-02                        |

**T-00 (no CI exists yet):** The repo has **no `.github/workflows/`**. T-00 lands first — the Stage 1 quality workflow (`bun install` → `prettier --check` → `eslint` → `bun run check` → `bun run test:unit -- --run` → `bun run test:e2e`). T-01 extends it with coverage. T-05–T-08 add security/supply-chain/build workflows; T-09 wires required checks + branch protection. Do **not** assume CI exists in any other issue.

**T-05–T-08 (safety pipeline):** Each is an independent workflow following the hardening rules in the [CI/CD pipeline](#cicd-pipeline-quality--security--supply-chain--deploy-to-kubernetes) section (least-privilege `permissions`, SHA-pinned actions, `concurrency`). They depend only on T-00 (so the base CI exists) and can run in parallel.

**T-09 (gate everything):** Turns the workflows into enforced merge requirements — branch protection on `master` requiring the T-00/T-01/T-05–T-08 checks, PR template, and CODEOWNERS. Must be done **after** the workflows exist so the required-check names are final.

**T-10–T-12 (deploy):** Container + K8s + CD pipeline for `https://cutline.i.psilva.org`. Reference implementations: `jpegs3` (`website/Dockerfile`, `website/infra/`, `.github/workflows/build-WEBSITE.yml`), `homelab7/plex/k8s/` (ingress + cert-manager on `*.i.psilva.org`), `image-works/docs/k8s/` (hardened Deployment probes). SSO (GitHub OAuth) and a persistent database are **explicitly deferred** — use ephemeral SQLite and a generated `BETTER_AUTH_SECRET` until M3+.

**✅ Implemented & live (2026-06-24) — `https://cutline.i.psilva.org` is serving on `tk8s` (Let's Encrypt TLS, `/healthz` 200).** Implementation deltas worth noting:

- **No `svelte.config.js`** — this repo configures the SvelteKit adapter inline in `vite.config.ts`, so the `adapter-auto` → `adapter-node` switch lives there. `@libsql/client`/`libsql` are also marked `ssr.external` (native binding must not be bundled).
- **Runtime deps promoted** — `@libsql/client`, `drizzle-orm`, `better-auth` moved from `devDependencies` to `dependencies`; otherwise Vite bundles them into the SSR output and the libsql native binding breaks at runtime.
- **DB bootstrap at startup** — `drizzle-kit push` needs a TTY, so the image ships generated migrations (`drizzle/`) applied by `scripts/migrate.mjs` (drizzle-orm libsql migrator) in `docker-entrypoint.sh`. Idempotent, runs every start.
- **Runtime is `bun` on `oven/bun:*-alpine`** (minimal, low-CVE) — `@libsql/client` ships both gnu and musl prebuilt bindings, so the musl one loads on alpine; build stages stay on debian. `better-sqlite3` (transitive `drizzle-kit` dep) is skipped via `--ignore-scripts`, and `esbuild`/`tsx` (build-only, transitive) are stripped from the runtime image (Go-stdlib CVEs, never run). The Trivy **image** scan in `build.yml` uses `ignore-unfixed: true`.
- **GHCR package is private** → the Deployment carries `imagePullSecrets: [cutline-regcred]`; the `cutline-app` Secret (`BETTER_AUTH_SECRET`) and the regcred are one-time manual bootstraps (see `infra/k8s/README.md`).

**T-01 dependency gap:** No coverage provider is installed. T-01 must `bun add -D @vitest/coverage-v8` and add a `test.coverage` block to `vite.config.ts` (provider `v8`, `reporter` `['text','html','lcov']`, per-area `thresholds` from the [Testing strategy](#testing-strategy) table). The browser (`client`) project needs coverage enabled too; verify thresholds aggregate across both `client` and `server` projects.

**Coverage gate is N/A until T-01 is green.** No coverage provider exists before T-01, so PRs merged earlier (e.g. T-00, M1-01, M1-02, and anything that lands before T-01) **cannot** be checked for coverage. For those, mark the coverage checkbox `N/A (pre-T-01)` in the PR/issue. Once T-01 merges, the coverage target becomes a hard requirement for all subsequent PRs.

**T-03 fixtures:** `user.ts`, `project.ts`, `transcript.ts`, `media-resource.ts` — for **tests only**. Production UI mocks belong in `src/lib/mocks/` (separate; same shapes encouraged). Both should implement the interfaces in [Shared type contracts](#shared-type-contracts).

---

### M1 — Foundation

| ID    | Title                                       | Labels                              | Target file(s)                                 | Tests                          | Status | Depends on         |
| ----- | ------------------------------------------- | ----------------------------------- | ---------------------------------------------- | ------------------------------ | ------ | ------------------ |
| M1-01 | Extract design tokens (`tokens.css`)        | `design-system`, `size:small`       | `src/lib/styles/tokens.css`                    | —                              | ready  | —                  |
| M1-02 | Global styles (scrollbar, animations, base) | `design-system`, `size:small`       | `src/lib/styles/global.css`                    | —                              | ready  | M1-01              |
| M1-03 | App root layout + fonts in `app.html`       | `layout`, `size:compose`            | `src/app.html`, `src/routes/+layout.svelte`    | `+layout.svelte.spec.ts`       | ready  | M1-01, M1-02       |
| M1-04 | `Button` component                          | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Button.svelte`          | `Button.svelte.spec.ts`        | ready  | M1-01, T-02        |
| M1-05 | `IconButton` component                      | `ui`, `design-system`, `size:small` | `src/lib/components/ui/IconButton.svelte`      | `IconButton.svelte.spec.ts`    | ready  | M1-01, T-02        |
| M1-06 | `Chip` component (selectable pill)          | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Chip.svelte`            | `Chip.svelte.spec.ts`          | ready  | M1-01, T-02        |
| M1-07 | `Toggle` component                          | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Toggle.svelte`          | `Toggle.svelte.spec.ts`        | ready  | M1-01, T-02        |
| M1-08 | `Avatar` component                          | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Avatar.svelte`          | `Avatar.svelte.spec.ts`        | ready  | M1-01, T-02        |
| M1-09 | `ProgressBar` component                     | `ui`, `design-system`, `size:small` | `src/lib/components/ui/ProgressBar.svelte`     | `ProgressBar.svelte.spec.ts`   | ready  | M1-01, T-02        |
| M1-10 | `Modal` base (overlay + panel + close)      | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Modal/*.svelte`         | `Modal.svelte.spec.ts`         | ready  | M1-04, M1-05, T-02 |
| M1-11 | `TimecodeDisplay` + `format-timecode` util  | `ui`, `size:small`                  | `TimecodeDisplay.svelte`, `format-timecode.ts` | `.svelte.spec.ts` + `.spec.ts` | ready  | M1-01, T-02        |
| M1-12 | `Input` component (search fields)           | `ui`, `design-system`, `size:small` | `src/lib/components/ui/Input.svelte`           | `Input.svelte.spec.ts`         | ready  | M1-01, T-02        |
| M1-13 | `EmptyState` component                      | `ui`, `design-system`, `size:small` | `src/lib/components/ui/EmptyState.svelte`      | `EmptyState.svelte.spec.ts`    | ready  | M1-01, T-02        |
| M1-14 | a11y conventions doc + lint rules for `ui/` | `design-system`, `testing`          | `docs/a11y.md` or section in AGENTS.md         | —                              | ready  | M1-04              |

**M1-01 design ref:** `<helmet>` styles lines 14–25; accent `#ff6a3d`; palette (`#0b0b0d`, `#0e0e10`, `#f3f2f0`, `#8b8a90`, etc.); `--accent` CSS variable; JetBrains Mono for monospace.

**M1-02 design ref:** Scrollbar styles (lines 18–21); `@keyframes spin`, `@keyframes pulseRec` (lines 23–24).

**M1-03 design ref:** Root wrapper line 28; JetBrains Mono + preconnect in `app.html` (design lines 11–13).

---

### M2 — Layout shells

| ID    | Title                                                  | Labels                                       | Target file(s)                                                  | Tests                        | Status | Depends on                |
| ----- | ------------------------------------------------------ | -------------------------------------------- | --------------------------------------------------------------- | ---------------------------- | ------ | ------------------------- |
| M2-01 | `AppSidebarLogo`                                       | `layout`, `component`, `size:small`          | `AppSidebar/AppSidebarLogo.svelte`                              | `.svelte.spec.ts`            | ready  | M1-01, T-02               |
| M2-02 | `AppSidebarNav` + `AppSidebarNavItem`                  | `layout`, `component`, `size:small`          | `AppSidebarNav.svelte`, `AppSidebarNavItem.svelte`              | `.svelte.spec.ts` each       | ready  | M1-01, T-02               |
| M2-03 | `AppSidebarStorage` (empty slot)                       | `layout`, `component`, `size:small`          | `AppSidebarStorage.svelte`                                      | `.svelte.spec.ts`            | ready  | M1-09, T-02               |
| M2-04 | `AppSidebarUser` (props only)                          | `layout`, `component`, `size:small`          | `AppSidebarUser.svelte`                                         | `.svelte.spec.ts`            | ready  | M1-08, T-02, T-03         |
| M2-05 | `AppSidebar` (composes 2-01–2-04)                      | `layout`, `component`, `screen:dashboard`    | `AppSidebar.svelte`                                             | `.svelte.spec.ts`            | ready  | M2-01–M2-04               |
| M2-06 | `DashboardLayout`                                      | `layout`, `screen:dashboard`, `size:compose` | `layout/DashboardLayout.svelte`                                 | `.svelte.spec.ts`            | ready  | M2-05                     |
| M2-07 | `DashboardHeader` (title + CTA slots)                  | `layout`, `screen:dashboard`, `size:small`   | `dashboard/DashboardHeader.svelte`                              | `.svelte.spec.ts`            | ready  | M1-04, T-02               |
| M2-08 | `EditorTopBar` shell                                   | `layout`, `screen:editor`, `size:small`      | `editor/EditorTopBar/EditorTopBar.svelte`                       | `.svelte.spec.ts`            | ready  | M1-04, T-02               |
| M2-09 | `TransportControls` shell                              | `screen:editor`, `component`, `size:small`   | `EditorTopBar/TransportControls.svelte`                         | `.svelte.spec.ts`            | ready  | M1-05, M1-11, T-02        |
| M2-10 | `EditorIconRail`                                       | `screen:editor`, `component`, `size:small`   | `editor/EditorIconRail.svelte`                                  | `.svelte.spec.ts`            | ready  | M1-05, T-02               |
| M2-11 | `EditorLayout`                                         | `layout`, `screen:editor`, `size:compose`    | `editor/EditorLayout.svelte`                                    | `.svelte.spec.ts`            | ready  | M2-08, M2-10              |
| M2-12 | `TimelineToolbar`                                      | `screen:editor`, `component`, `size:small`   | `timeline/TimelineToolbar.svelte`                               | `.svelte.spec.ts`            | ready  | M1-04, M1-07, T-02        |
| M2-13 | `TimelineRuler` (empty ticks slot)                     | `screen:editor`, `component`, `size:small`   | `timeline/TimelineRuler.svelte`                                 | `.svelte.spec.ts`            | ready  | M1-01, T-02               |
| M2-14 | `TimelineTrack` (generic track row)                    | `screen:editor`, `component`, `size:small`   | `timeline/TimelineTrack.svelte`                                 | `.svelte.spec.ts`            | ready  | M1-01, M1-13, T-02        |
| M2-15 | `TimelinePlayhead`                                     | `screen:editor`, `component`, `size:small`   | `timeline/TimelinePlayhead.svelte`                              | `.svelte.spec.ts`            | ready  | M1-01, T-02               |
| M2-16 | `TimelineWaveform` (A1 bars + played overlay)          | `screen:editor`, `component`, `size:small`   | `timeline/TimelineWaveform.svelte`                              | `.svelte.spec.ts`            | ready  | M1-01, T-02               |
| M2-17 | `Timeline` (composes toolbar, ruler, tracks, playhead) | `screen:editor`, `component`, `size:small`   | `timeline/Timeline.svelte`                                      | `.svelte.spec.ts`            | ready  | M2-12–M2-16               |
| M2-18 | `ExportModal` shell (config step UI only)              | `screen:editor`, `component`, `size:small`   | `modals/ExportModal/*.svelte`                                   | `ExportModal.svelte.spec.ts` | ready  | M1-10, M1-06, M1-07, T-02 |
| M2-19 | `ExportProgress` + `ExportComplete` shells             | `screen:editor`, `component`, `size:small`   | `ExportProgress.svelte`, `ExportComplete.svelte`                | `.svelte.spec.ts` each       | ready  | M1-10, M1-09, T-02        |
| M2-20 | `RecordModal` shell                                    | `screen:editor`, `component`, `size:small`   | `modals/RecordModal/RecordModal.svelte`, `RecordPreview.svelte` | `.svelte.spec.ts`            | ready  | M1-10, T-02               |
| M2-21 | `RecordReview` + `RecordSourceTabs` shells             | `screen:editor`, `component`, `size:small`   | `RecordReview.svelte`, `RecordSourceTabs.svelte`                | `.svelte.spec.ts`            | ready  | M1-10, M1-04, T-02        |
| M2-22 | `RecBadge` (pulse REC indicator)                       | `screen:editor`, `component`, `size:small`   | `src/lib/components/ui/RecBadge.svelte`                         | `.svelte.spec.ts`            | ready  | M1-02, T-02               |
| M2-23 | `MediaShelf` shell + `MediaCard`                       | `screen:editor`, `component`, `size:small`   | `modals/MediaShelf.svelte`, `MediaCard.svelte`                  | `.svelte.spec.ts`            | ready  | M1-10, T-02               |
| M2-24 | `TranscriptSpeaker` block                              | `screen:editor`, `component`, `size:small`   | `transcript/TranscriptSpeaker.svelte`                           | `.svelte.spec.ts`            | ready  | M1-08, T-02, T-03         |
| M2-25 | Shell preview route (`/demo/shells`)                   | `layout`, `size:compose`                     | `src/routes/demo/shells/+page.svelte`                           | `shells.e2e.ts` (T-04)       | ready  | M2-06, M2-11, M2-17       |

**M2-02 design ref:** Sidebar nav lines 41–45 (Home, All projects, Templates, Trash). Nav items are static labels; links disabled or `#` until routes exist.

**M2-03 design ref:** Storage widget lines 47–50. Use mock from `$lib/mocks/storage.mock.ts` with `TODO(backend)` until storage API exists.

**M2-04 design ref:** User block lines 52–55. Props: `user` from session; mock user in dev route/load only with `TODO(backend): session from better-auth`.

**M2-08–M2-09 design ref:** Editor top bar lines 115–152; transport lines 127–144.

**M2-14 design ref:** B-roll empty state line 300–301 (via `EmptyState` in track).

**M2-16 design ref:** A1 waveform lines 320–332.

**M2-17 design ref:** Timeline lines 259–350.

**M2-18–M2-19 design ref:** Export modal lines 450–503.

**M2-20–M2-21 design ref:** Record modal lines 382–448; source tabs lines 429–434.

**M2-22 design ref:** REC badge lines 214, 421 (`pulseRec` animation).

**M2-23 design ref:** Media shelf lines 352–380; media card lines 366–377.

**M2-24 design ref:** Transcript speaker block lines 190–193.

**M2-25:** Composes M2-06 + M2-11; may pass mocks from `$lib/mocks/` for visual preview. E2E asserts shells mount.

---

### M3 — Auth UI

| ID    | Title                                      | Labels                         | Target file(s)                                            | Tests                                                | Status  | Depends on                |
| ----- | ------------------------------------------ | ------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- | ------- | ------------------------- |
| M3-01 | Auth layout (matches Cutline visual style) | `ui`, `layout`, `blocked:auth` | `src/routes/(auth)/+layout.svelte`                        | `.svelte.spec.ts`                                    | ready\* | M1-01, M1-02, M1-03, T-02 |
| M3-02 | Login page (better-auth, styled)           | `ui`, `blocked:auth`           | `src/routes/(auth)/login/+page.svelte`, `+page.server.ts` | `.svelte.spec.ts` + `login.spec.ts` + `login.e2e.ts` | ready\* | M3-01, M1-04, T-02        |
| M3-03 | Signup page (if applicable)                | `ui`, `blocked:auth`           | `src/routes/(auth)/signup/+page.svelte`                   | `.svelte.spec.ts` + `signup.e2e.ts`                  | ready\* | M3-01, M1-04, T-02        |

\*Auth infrastructure exists (`better-auth`, demo routes under `src/routes/demo/better-auth/`). Mock session in dev only with `TODO(backend): better-auth session`.

**Note:** The Claude design assumes a logged-in user but includes no login screen. Auth is a gap filled by M3.

---

### M4 — Dashboard (data-backed)

| ID    | Title                                   | Labels                                                 | Target file(s)                               | Tests                                  | Status       | Depends on                 | Data required            |
| ----- | --------------------------------------- | ------------------------------------------------------ | -------------------------------------------- | -------------------------------------- | ------------ | -------------------------- | ------------------------ |
| M4-00 | Dashboard domain types (`project.ts`)   | `blocked:data`, `size:small`                           | `src/lib/types/project.ts`                   | `project.spec.ts` (type guards if any) | blocked:data | Schema PR                  | Drizzle `projects` table |
| M4-01 | `ProjectCard` component                 | `ui`, `screen:dashboard`, `blocked:data`, `size:small` | `dashboard/ProjectCard.svelte`               | `.svelte.spec.ts` + fixture from T-03  | blocked:data | M1-01, M4-00, T-03         | Project shape            |
| M4-02 | `ProjectGrid` component                 | `screen:dashboard`, `blocked:data`, `size:small`       | `ProjectGrid.svelte`                         | `.svelte.spec.ts`                      | blocked:data | M4-01, T-03                | `projects[]`             |
| M4-03 | `ContinueEditingHero`                   | `screen:dashboard`, `blocked:data`, `size:small`       | `ContinueEditingHero.svelte`                 | `.svelte.spec.ts` + T-03 fixture       | blocked:data | M1-04, M4-00, T-03         | Latest project           |
| M4-04 | Home route `+page` + `+page.server`     | `screen:dashboard`, `blocked:data`, `size:compose`     | `src/routes/+page.svelte`, `+page.server.ts` | `+page.server.spec.ts`, `home.e2e.ts`  | blocked:data | M2-06, M4-02, M4-03, M1-13 | projects, session        |
| M4-05 | `AppSidebarStorage` — wire real storage | `layout`, `blocked:data`                               | `AppSidebarStorage.svelte`                   | `.svelte.spec.ts`                      | blocked:data | M2-03                      | Storage API              |
| M4-06 | `AppSidebarUser` — wire session user    | `layout`, `blocked:data`                               | `AppSidebarUser.svelte`                      | `.svelte.spec.ts` + T-03 user fixture  | blocked:data | M2-04, M3-02, T-03         | User session             |

**M4-03 design ref:** Continue editing hero lines 72–88.

**M4-01 design ref:** Project cards lines 92–104.

**M4-04 design ref:** Dashboard main lines 59–106.

**M4-04 example composition (target ~50 lines):**

```svelte
<!-- Parent receives data from +page.server.ts (real or mock — mocks live in server load, not here) -->
<DashboardLayout>
	<DashboardHeader user={data.user} />
	{#if data.latestProject}
		<ContinueEditingHero project={data.latestProject} />
	{/if}
	{#if data.projects.length}
		<ProjectGrid projects={data.projects} />
	{:else}
		<EmptyState title="No projects yet" />
	{/if}
</DashboardLayout>
```

```ts
// +page.server.ts — example during UI phase
// MOCK: Dashboard data until projects table exists.
// TODO(backend): Replace with drizzle query (M4-04).
import { mockProjects, mockUser } from '$lib/mocks/dashboard.mock';

export const load = async () => ({
	user: mockUser,
	projects: mockProjects,
	latestProject: mockProjects[0] ?? null
});
```

---

### M5 — Editor (data-backed)

| ID     | Title                                                           | Labels                                          | Target file(s)                                                         | Tests                                   | Status       | Depends on                        | Data required              |
| ------ | --------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------ | --------------------------------- | -------------------------- |
| M5-00  | Editor types + `EditorState` class                              | `blocked:data`, `size:small`                    | `src/lib/types/transcript.ts`, `src/lib/editor/editor-state.svelte.ts` | `editor-state.spec.ts`                  | blocked:data | Schema PR                         | Transcript model           |
| M5-00b | **Editor derivations util** (pure functions ported from design) | `blocked:data`, `size:small`                    | `src/lib/editor/editor-derive.ts`                                      | `editor-derive.spec.ts`                 | ready\*      | M5-00                             | Transcript model           |
| M5-01  | `TranscriptSearch`                                              | `screen:editor`, `blocked:data`, `size:small`   | `transcript/TranscriptSearch.svelte`                                   | `.svelte.spec.ts`                       | blocked:data | M1-12, T-02                       | —                          |
| M5-02  | `TranscriptWord`                                                | `screen:editor`, `blocked:data`, `size:small`   | `transcript/TranscriptWord.svelte`                                     | `.svelte.spec.ts` + T-03                | blocked:data | M5-00, T-03                       | Word model                 |
| M5-03  | `TranscriptSentence`                                            | `screen:editor`, `blocked:data`, `size:small`   | `transcript/TranscriptSentence.svelte`                                 | `.svelte.spec.ts` + T-03                | blocked:data | M5-02, M1-11, T-03                | Sentence model             |
| M5-04  | `TranscriptSelectionBar`                                        | `screen:editor`, `blocked:data`, `size:small`   | `transcript/TranscriptSelectionBar.svelte`                             | `.svelte.spec.ts`                       | blocked:data | M1-04, T-02                       | Selection state            |
| M5-05  | `TranscriptPanel`                                               | `screen:editor`, `blocked:data`, `size:small`   | `transcript/TranscriptPanel.svelte`                                    | `.svelte.spec.ts` + T-03                | blocked:data | M5-01–M5-04, M2-24                | Transcript API             |
| M5-06  | `PreviewPlayer`                                                 | `screen:editor`, `blocked:data`, `size:small`   | `preview/PreviewPlayer.svelte`                                         | `.svelte.spec.ts`                       | blocked:data | M1-05, M2-22, T-02                | Video URL                  |
| M5-07  | `PreviewCaptions`                                               | `screen:editor`, `blocked:data`, `size:small`   | `preview/PreviewCaptions.svelte`                                       | `.svelte.spec.ts` + T-03                | blocked:data | M5-02, T-03                       | Caption words              |
| M5-08  | `PreviewStats`                                                  | `screen:editor`, `blocked:data`, `size:small`   | `preview/PreviewStats.svelte`                                          | `.svelte.spec.ts`                       | blocked:data | M1-11, T-02                       | Edit stats                 |
| M5-09  | `CaptionStylePicker`                                            | `screen:editor`, `blocked:data`, `size:small`   | `preview/CaptionStylePicker.svelte`                                    | `.svelte.spec.ts`                       | blocked:data | M1-06, T-02                       | Local preference           |
| M5-10  | `PreviewPanel`                                                  | `screen:editor`, `blocked:data`, `size:small`   | `preview/PreviewPanel.svelte`                                          | `.svelte.spec.ts`                       | blocked:data | M5-06–M5-09                       | —                          |
| M5-11  | Wire `TransportControls` to `EditorState`                       | `screen:editor`, `blocked:data`                 | `TransportControls.svelte`                                             | extend `.svelte.spec.ts`                | blocked:data | M2-09, M5-00, M5-06               | Player state               |
| M5-12  | Editor route `projects/[id]` + server load                      | `screen:editor`, `blocked:data`, `size:compose` | `+page.svelte`, `+page.server.ts`                                      | `+page.server.spec.ts`, `editor.e2e.ts` | blocked:data | M2-11, M2-17, M5-05, M5-10, M5-00 | Project, transcript, video |

**M5-00b (new):** The design's interaction math lives in `renderVals()` (design lines 750–847) and is currently homeless — split into wiring issues where it would be re-derived inconsistently. Extract as **pure, DOM-free, fully tested** functions so timeline, waveform, preview, and captions all share one implementation:

- `buildStartMap(activeWords)` → `{ id: startSeconds }` (lines 759–763)
- `totalDuration(words)` → seconds, ignoring `deleted` (lines 686–690, 758–763)
- `currentWordId(activeWords, startMap, ct)` (lines 766–768)
- `waveformBars(activeWords, startMap, total)` → `WaveBar[]` (lines 813–824)
- `trackClips(wordsBySentence, startMap, total)` → `Clip[]` (lines 826–837)
- `rulerTicks(total, count = 8)` → `Tick[]` (lines 839–842)
- `captionWords(activeWords, currentId, style, accent)` (lines 798–811)
- `formatTimecode(seconds)` (lines 743–748 — this is the same util as **M1-11**; do not duplicate)

These are deterministic given inputs → ideal table-driven tests (Template C). `EditorState` (M5-00) consumes them; it must not re-implement them.

`ready*` = unblocked for implementation **now** (operates on plain `Word[]`/`Sentence[]` inputs via the [shared type contracts](#shared-type-contracts) + a test fixture); it does **not** require the DB schema, so it can land in parallel with M2 rather than waiting for M5 data.

**M5-05 design ref:** Transcript panel lines 167–206.

**M5-10 design ref:** Preview panel lines 209–255.

**M5-12 design ref:** Full editor workspace lines 154–350.

---

### M6 — Editor features (data-backed)

| ID    | Title                                     | Labels                                        | Target file(s)                                           | Tests                                              | Status       | Depends on          | Data required           |
| ----- | ----------------------------------------- | --------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- | ------------ | ------------------- | ----------------------- |
| M6-00 | Timeline + media domain types             | `blocked:data`, `size:small`                  | `src/lib/types/timeline.ts`, `media.ts`                  | `.spec.ts`                                         | blocked:data | Schema PR           | Timeline + media models |
| M6-01 | `TimelineClip`                            | `screen:editor`, `blocked:data`, `size:small` | `timeline/TimelineClip.svelte`                           | `.svelte.spec.ts` + T-03                           | blocked:data | M2-14, M6-00, T-03  | Clip model              |
| M6-02 | Wire timeline tracks (V1, A1, CC, B-roll) | `screen:editor`, `blocked:data`               | `Timeline.svelte`, tracks                                | extend `.svelte.spec.ts`                           | blocked:data | M2-17, M6-01, M6-00 | Timeline model          |
| M6-03 | Timeline click → seek (`EditorState`)     | `screen:editor`, `blocked:data`               | `Timeline.svelte`                                        | `Timeline.svelte.spec.ts` + `editor-state.spec.ts` | blocked:data | M6-02, M5-00, M5-11 | Duration, playhead      |
| M6-04 | `MediaShelf` — wire resource list         | `screen:editor`, `blocked:data`               | `MediaShelf.svelte`, `MediaCard.svelte`                  | `.svelte.spec.ts` + T-03                           | blocked:data | M2-23, M6-00, T-03  | Media library API       |
| M6-05 | `RecordModal` — camera + recording flow   | `screen:editor`, `blocked:data`               | `RecordModal/*`                                          | `.svelte.spec.ts` + mocked `mediaDevices`          | blocked:data | M2-20, M6-00        | Media capture API       |
| M6-06 | B-roll overlays on timeline               | `screen:editor`, `blocked:data`               | `TimelineTrack.svelte`                                   | `.svelte.spec.ts`                                  | blocked:data | M6-02, M6-04        | Overlays model          |
| M6-07 | `ExportModal` — wire export job           | `screen:editor`, `blocked:data`               | `ExportModal/*`                                          | `.svelte.spec.ts` + `export-job.spec.ts`           | blocked:data | M2-18, M6-00        | Export job API          |
| M6-08 | Filler removal action                     | `screen:editor`, `blocked:data`               | `TranscriptPanel.svelte`                                 | extend `.svelte.spec.ts`                           | blocked:data | M5-05, M5-00        | Transcript edit API     |
| M6-09 | Word select / delete / restore            | `screen:editor`, `blocked:data`               | `TranscriptWord.svelte`, `TranscriptSelectionBar.svelte` | extend `.svelte.spec.ts`                           | blocked:data | M5-02, M5-04, M5-00 | Transcript edit API     |
| M6-10 | Keyboard shortcuts (space, delete)        | `screen:editor`, `blocked:data`               | `src/lib/utils/editor-keyboard.ts`                       | `editor-keyboard.spec.ts` + editor E2E             | blocked:data | M5-11, M6-09, M5-12 | Editor mounted          |

**M6-04 design ref:** Media shelf lines 352–380.

**M6-05 design ref:** Record modal lines 382–448.

**M6-07 design ref:** Export modal lines 450–503.

**M6-02 design ref:** Timeline tracks lines 289–347 (B-roll, V1, A1, CC, waveform via M2-16, playhead).

---

## Dependency graph

```text
Epic: Implement Claude design
│
├── M0 DevEx, safety & Kubernetes deploy (do first)
│   T-00 quality CI ── T-01 coverage CI
│   T-00 ──┬── T-05 secret scan
│          ├── T-06 supply-chain / deps
│          ├── T-07 CodeQL SAST
│          └── T-08 build + SBOM + scan
│   T-00..T-08 ── T-09 repo hardening (PR template, CODEOWNERS, branch protection)
│   T-08 ── T-10 containerize (adapter-node, Dockerfile, /healthz)
│   T-10 ── T-11 K8s manifests (namespace cutline, ingress cutline.i.psilva.org)
│   T-10 + T-11 ── T-12 CD (GHCR push + kubectl rollout)
│   T-00 ── T-02 test helpers ── T-03 fixtures ── T-04 E2E shells ── M2-25
│
├── M1 Foundation
│   M1-01 tokens
│   ├── M1-02 global styles
│   ├── M1-03 app layout + app.html fonts
│   ├── M1-04 Button ──┬── M1-10 Modal
│   ├── M1-05 IconButton
│   ├── M1-06 Chip
│   ├── M1-07 Toggle
│   ├── M1-08 Avatar
│   ├── M1-09 ProgressBar ── M2-03 AppSidebarStorage
│   ├── M1-11 TimecodeDisplay
│   ├── M1-12 Input ── M5-01 TranscriptSearch
│   ├── M1-13 EmptyState ── M2-14, M4-04
│   └── M1-14 a11y conventions
│
├── M2 Layout shells
│   M2-01–04 sidebar parts ── M2-05 AppSidebar ── M2-06 DashboardLayout ── M2-25 shells route
│   M2-07 DashboardHeader
│   M2-08 EditorTopBar ── M2-09 TransportControls
│   M2-10 EditorIconRail
│   M2-08 + M2-10 ── M2-11 EditorLayout
│   M2-12–16 timeline parts ── M2-17 Timeline
│   M2-18–19 Export modal shells
│   M2-20–21 Record modal shells
│   M2-22 RecBadge ── M5-06 PreviewPlayer
│   M2-23 MediaShelf + MediaCard
│   M2-24 TranscriptSpeaker ── M5-05
│
├── M3 Auth UI
│   M3-01 auth layout ── M3-02 login, M3-03 signup
│
├── M4 Dashboard (blocked:data)
│   M4-00 project types
│   M4-01 ProjectCard ── M4-02 ProjectGrid
│   M4-03 ContinueEditingHero
│   M2-06 + M4-02 + M4-03 ── M4-04 Home route
│   M2-03 ── M4-05 storage wiring
│   M2-04 + M3 ── M4-06 user wiring
│
├── M5 Editor (blocked:data)
│   M5-00 EditorState + transcript types ── M5-11, M6-03, M6-08, M6-09
│   M5-00b editor-derive util (pure; ready early) ── M5-00, M2-16, M2-17, M5-10
│   M5-02 TranscriptWord ── M5-03 TranscriptSentence
│   M5-01–04 + M2-24 ── M5-05 TranscriptPanel
│   M5-06–09 ── M5-10 PreviewPanel
│   M2-09 + M5-00 + M5-06 ── M5-11 Transport wiring
│   M2-11 + M2-17 + M5-05 + M5-10 + M5-00 ── M5-12 Editor route
│
└── M6 Editor features (blocked:data)
    M6-00 timeline + media types
    M6-01 TimelineClip ── M6-02 timeline data
    M6-02 + M5-00 ── M6-03 seek
    M2-23 + M6-00 ── M6-04 media shelf data
    M2-20 ── M6-05 recording
    M6-02 + M6-04 ── M6-06 B-roll overlays
    M2-18 ── M6-07 export job
    M5-05 + M5-00 ── M6-08 filler removal
    M5-02 + M5-04 + M5-00 ── M6-09 word edit
    M5-11 + M6-09 ── M6-10 keyboard shortcuts
```

When creating GitHub issues, use **"Blocked by #NN"** in issue bodies for cross-issue dependencies.

---

## Target folder structure

```text
src/lib/
  mocks/                          ← documented temporary data (TODO to replace)
    dashboard.mock.ts             ← M4 UI phase
    editor.mock.ts                ← M5 UI phase
    storage.mock.ts               ← M4-05 UI phase
  styles/
    tokens.css                    ← M1-01
    global.css                    ← M1-02
  types/
    project.ts                    ← M4-00
    transcript.ts                 ← M5-00
    timeline.ts                   ← M6-00
    media.ts                      ← M6-00
  test/
    render.ts                     ← T-02
    setup.ts                      ← T-02
    fixtures/
      user.ts                     ← T-03
      project.ts                  ← T-03
      transcript.ts               ← T-03
      media-resource.ts           ← T-03
  editor/
    editor-state.svelte.ts        ← M5-00
    editor-state.spec.ts
  utils/
    format-timecode.ts            ← M1-11
    format-timecode.spec.ts
    editor-keyboard.ts            ← M6-10
    editor-keyboard.spec.ts
  components/
    ui/
      Button.svelte               ← M1-04
      Button.svelte.spec.ts
      IconButton.svelte           ← M1-05
      Chip.svelte                 ← M1-06
      Toggle.svelte               ← M1-07
      Avatar.svelte               ← M1-08
      ProgressBar.svelte          ← M1-09
      Input.svelte                ← M1-12
      EmptyState.svelte           ← M1-13
      RecBadge.svelte             ← M2-22
      TimecodeDisplay.svelte      ← M1-11
      Modal/                      ← M1-10
    layout/
      AppSidebar/                 ← M2-01–M2-05
      DashboardLayout.svelte      ← M2-06
    dashboard/
      DashboardHeader.svelte      ← M2-07
      ContinueEditingHero.svelte  ← M4-03
      ProjectCard.svelte          ← M4-01
      ProjectGrid.svelte          ← M4-02
    editor/
      EditorLayout.svelte         ← M2-11
      EditorIconRail.svelte       ← M2-10
      EditorTopBar/               ← M2-08, M2-09, M5-11
      transcript/
        TranscriptSpeaker.svelte  ← M2-24
        TranscriptPanel.svelte    ← M5-05
        TranscriptSearch.svelte   ← M5-01
        TranscriptSelectionBar.svelte
        TranscriptSentence.svelte
        TranscriptWord.svelte
      preview/                    ← M5-06–M5-10
      timeline/
        Timeline.svelte           ← M2-17, M6-02, M6-03
        TimelineToolbar.svelte    ← M2-12
        TimelineRuler.svelte      ← M2-13
        TimelineTrack.svelte      ← M2-14, M6-06
        TimelineWaveform.svelte   ← M2-16
        TimelinePlayhead.svelte   ← M2-15
        TimelineClip.svelte       ← M6-01
      modals/
        MediaShelf.svelte         ← M2-23, M6-04
        MediaCard.svelte          ← M2-23
        RecordModal/              ← M2-20, M6-05
        ExportModal/              ← M2-18, M6-07
routes/
  +layout.svelte                  ← M1-03
  +page.svelte                    ← M4-04
  +page.server.ts                 ← M4-04
  (auth)/                         ← M3
  demo/shells/+page.svelte        ← M2-25
  projects/[id]/                  ← M5-12
```

Co-locate `*.svelte.spec.ts` beside each component and `*.spec.ts` beside each util/server module.

---

## Design → component map

Quick reference from `Cutline.dc.html` sections to issues.

| Design region           | HTML lines | Issues                          |
| ----------------------- | ---------- | ------------------------------- |
| Global / helmet / fonts | 10–28      | M1-01, M1-02, M1-03             |
| Sidebar logo            | 35–39      | M2-01                           |
| Sidebar nav             | 41–45      | M2-02                           |
| Sidebar storage         | 47–50      | M2-03, M4-05                    |
| Sidebar user            | 52–55      | M2-04, M4-06                    |
| Dashboard header        | 60–68      | M2-07                           |
| Continue editing hero   | 72–88      | M4-03                           |
| Project grid / cards    | 90–105     | M4-01, M4-02                    |
| Editor top bar          | 115–152    | M2-08, M2-09, M5-11             |
| Editor icon rail        | 158–164    | M2-10                           |
| Transcript speaker      | 190–193    | M2-24                           |
| Transcript panel        | 167–206    | M5-01–M5-05, M6-08, M6-09       |
| Preview panel           | 209–255    | M5-06–M5-10, M2-22              |
| Timeline                | 259–350    | M2-12–M2-17, M6-01–M6-03, M6-06 |
| Waveform (A1)           | 320–332    | M2-16                           |
| Media shelf / card      | 352–380    | M2-23, M6-04                    |
| Record modal            | 382–448    | M2-20, M2-21, M6-05             |
| Export modal            | 450–503    | M2-18, M2-19, M6-07             |

---

## Issue templates

Copy the **Test quality review** block into every implementation issue. PRs cannot merge without all boxes checked.

**Standard context header — prepend to every generated issue body** so each is self-contained for an autonomous agent:

```markdown
Planning-ID: <PID> · Milestone: <Mn>
Read first: PLANNING.md →
• Agent runbook & conventions (commands, MCP, branching, DoD)
• Design → Svelte translation guide
• Design tokens reference · Shared type contracts
• Reading the design file
Design source: design-by-claude/Cutline.dc.html (lines <range>)
Blocked by: <PIDs → map to #NN before starting>
```

---

### Template A — Component issue (M1/M2/M5 UI)

```markdown
## Goal

Implement `<ComponentName>` from the Claude design as a presentational Svelte 5 component.

## Planning ID

M2-05

## Design reference

- File: `design-by-claude/Cutline.dc.html`
- Section: [describe section]
- Lines: [line range]

## Target files

- `src/lib/components/.../ComponentName.svelte`
- `src/lib/components/.../ComponentName.svelte.spec.ts` **(required, same PR)**

## Scope

- [Bullet list of what is included]

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

| Test                  | Asserts (behavior, not implementation)                         |
| --------------------- | -------------------------------------------------------------- |
| renders default state | Specific visible text, role, or structure from design          |
| [variant / prop]      | Output changes when prop changes (e.g. `disabled`, `selected`) |
| user interaction      | `click` / `keyboard` → callback fired or DOM updates           |
| a11y                  | Correct role, `aria-*`, focusable, labelled control            |
| empty / null props    | Graceful hide or empty state — no crash                        |

Use fixtures from `src/lib/test/fixtures/` when props need domain objects.

## Test quality review (required before merge)

> **Purpose:** Confirm tests exercise real product behavior — not placeholders that pass without protecting quality.

- [ ] **Traceability:** Each `it(...)` maps to a row in **Tests to write** or an acceptance criterion below
- [ ] **Failure test:** If the feature were removed, at least one test would fail (reviewer: verify mentally)
- [ ] **No hollow assertions:** No `expect(true).toBe(true)`, no-only `toBeDefined()` / `toBeTruthy()` on mount without checking output
- [ ] **No implementation coupling:** Tests do not import private state, `$state` internals, or CSS module hashes
- [ ] **Real interactions:** User actions use `click`, `fill`, `keyboard` — not direct handler invocation unless unit-testing a pure helper
- [ ] **Meaningful fixtures:** Component tests use `src/lib/test/fixtures/*` — production mocks use `src/lib/mocks/*` only in routes/load
- [ ] **No mock-the-world:** Only mock browser APIs (e.g. `mediaDevices`) or server when unavoidable; do not mock the component under test
- [ ] **Coverage:** New/changed lines meet milestone target (see Testing strategy in PLANNING.md)
- [ ] **Reviewer sign-off:** Tests would catch a regression in this component's scope

### Anti-patterns (reject in PR)

- Snapshot of entire `document.body` with no behavioral assertion
- Testing that Svelte "renders without error" only
- Duplicate tests asserting the same fact five times
- Tests that pass when the expected text/role is wrong

## Acceptance criteria

- [ ] Component matches design tokens (M1-01)
- [ ] Presentational: props in, callbacks out
- [ ] Co-located `ComponentName.svelte.spec.ts` passes (`bun run test:unit`)
- [ ] Test quality review checkboxes all checked
- [ ] PR links to this issue

## Depends on

- Blocked by: #NN

## Milestone

M2 — Layout shells
```

---

### Template B — Data-backed issue (M4/M5/M6)

```markdown
## Goal

Wire [feature] to real server data.

## Planning ID

M4-04

## Design reference

- File: `design-by-claude/Cutline.dc.html`
- Lines: [line range]

## Data required

- [ ] `projects` table / API
- [ ] User session

## Target files

- `src/routes/+page.server.ts` + `+page.server.spec.ts`
- `src/routes/+page.svelte` (composition only, ~50–80 lines)
- `src/routes/home.e2e.ts` (if user-facing flow)

## Out of scope

- Undocumented hardcoded data in components
- Closing issue as "wired" while `src/lib/mocks/` still feeds this route

## Mock data (if backend not ready)

- [ ] `+page.server.ts` imports from `$lib/mocks/*` with `MOCK` + `TODO(backend)` comments
- [ ] Issue remains open (or sub-issue created) until real drizzle/API replaces mock

## Tests to write

| Layer  | File                              | Asserts                                                                                                             |
| ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Server | `+page.server.spec.ts`            | Real test DB or mocked drizzle: empty DB → `projects: []`; seeded DB → correct shape; unauthorized → redirect/error |
| Page   | `+page.svelte.spec.ts` (optional) | Correct child components receive loaded props                                                                       |
| E2E    | `home.e2e.ts`                     | Authenticated user sees empty state OR real project from seed — never hardcoded "Alex Chen"                         |

## Test quality review (required before merge)

> **Purpose:** Confirm tests exercise real product behavior — not placeholders that pass without protecting quality.

- [ ] **Traceability:** Each test maps to a row in **Tests to write** or acceptance criteria
- [ ] **Failure test:** Removing `load` logic or empty-state branch breaks at least one test
- [ ] **DB realism:** Server tests use test database seed or drizzle mock matching production schema — not ad-hoc objects missing required fields
- [ ] **Empty path covered:** Test empty `projects: []` separately from mock-populated dev load
- [ ] **Auth path covered:** Unauthorized / logged-out behavior tested where applicable
- [ ] **E2E uses real flow:** Login → navigate → assert DOM — not `page.setContent('<div>fake</div>')`
- [ ] **No hollow assertions:** No tests that only check HTTP 200 without body/shape
- [ ] **Coverage:** `+page.server.ts` ≥ 85% lines on changed code
- [ ] **Reviewer sign-off:** Tests would catch data regression for this route

### Anti-patterns (reject in PR)

- `load` tests that never assert return value fields
- E2E that intercepts API with fake JSON unrelated to schema
- Component tests with 20 fake projects when the test claims to cover **empty state**

## Acceptance criteria

- [ ] `load` returns real DB data **or** documented mocks with TODOs (UI phase only)
- [ ] Empty state when `projects.length === 0` — uses `EmptyState` (M1-13)
- [ ] Route page is thin composition only
- [ ] All tests pass; test quality review checked
- [ ] If mocks used: linked follow-up or same issue open until `TODO` resolved
- [ ] PR links to this issue

## Depends on

- Blocked by: #NN (schema), #NN (components)

## Milestone

M4 — Dashboard (data-backed)
```

---

### Template C — Pure util / state (M1-11, M5-00, M6-10)

```markdown
## Goal

Implement `[function | EditorState method]` with full unit coverage.

## Planning ID

M5-00

## Target files

- `src/lib/editor/editor-state.svelte.ts`
- `src/lib/editor/editor-state.spec.ts`

## Tests to write (table-driven)

| Case                | Input                      | Expected                                       |
| ------------------- | -------------------------- | ---------------------------------------------- |
| initial state       | —                          | `playing === false`, `currentTime === 0`       |
| `togglePlay` at end | `currentTime === duration` | resets to 0 or clamps per spec                 |
| `seek`              | `t = 30`                   | `currentTime === 30`, derived timecode updates |
| edge: seek past end | `t > duration`             | clamps to duration                             |

## Test quality review (required before merge)

- [ ] **Edge cases:** At least one test per public method for normal + boundary input
- [ ] **Failure test:** Wrong formula in `formatTimecode` / wrong seek math fails tests
- [ ] **No DOM:** Node environment tests — logic only
- [ ] **Coverage:** ≥ 90% lines for `src/lib/editor/**`
- [ ] **Reviewer sign-off:** Tests document expected behavior as living spec

## Acceptance criteria

- [ ] `editor-state.spec.ts` passes
- [ ] No `$effect` that mutates state for derived values — use `$derived`
- [ ] Test quality review checked
```

---

### Template D — Test infrastructure (T-\*)

```markdown
## Goal

[T-01: Add coverage thresholds to CI]

## Planning ID

T-01

## Target files

- `vite.config.ts` — `coverage` thresholds
- `.github/workflows/ci.yml` — fail if below threshold

## Acceptance criteria

- [ ] `bun run test:unit -- --coverage` reports thresholds from PLANNING.md
- [ ] CI fails when coverage drops below threshold on changed files (or global)
- [ ] Document command in README or AGENTS.md
```

---

## Suggested sprint order

### Sprint 0 — DevEx, safety & Kubernetes deploy (do FIRST, before any component work)

1. **T-00** quality CI → **T-01** coverage gate
2. **T-05** secret scanning · **T-06** supply-chain/deps · **T-07** CodeQL · **T-08** build + SBOM (parallel, after T-00)
3. **T-09** repo hardening: PR template + CODEOWNERS + branch protection requiring all the above checks
4. **T-10** containerize (`adapter-node`, Dockerfile, `/healthz`) → **T-11** K8s manifests (`infra/k8s/`, ingress `cutline.i.psilva.org`) → **T-12** CD workflow (`deploy.yml`, GHCR + `kubectl`)
5. **T-02** → **T-03** (test helpers + typed fixtures — parallel with Sprint 1)

**Outcome:** every PR runs quality + coverage + secret/dependency/SAST + build/SBOM checks; `master`
is protected; merges to `master` roll out to **`https://cutline.i.psilva.org`** on `tk8s`; shared
`render()` helper + fixtures ready.

### Sprint 1 — Visual foundation

1. M1-01 → M1-02 → M1-03
2. M1-14 (a11y conventions)
3. M1-04, M1-05, M1-06, M1-07, M1-08, M1-09, M1-12, M1-13 (parallel — **each PR includes `.svelte.spec.ts`**)
4. M1-10, M1-11

**Outcome:** Tokens, primitives, utils tested ≥ 85–95% coverage.

### Sprint 2 — Shells

1. M2-01 → … → M2-06
2. M2-07
3. M2-08 → M2-11
4. M2-12 → M2-17 (timeline, including M2-16 waveform)
5. M2-18 → M2-24 (modals, media, speaker)
6. M2-25 + T-04 (shell preview + E2E smoke)

**Outcome:** Full UI tree composable; `/demo/shells` E2E proves mounts; mocks only via `$lib/mocks/` with TODOs.

### Sprint 3 — Auth

1. M3-01 → M3-02 → M3-03 (include login E2E)

### Sprint 4+ — Unblock as backend lands

Prioritize by product dependency:

1. **Projects schema** → M4-00, then M4-01 through M4-04
2. **User session in layout** → M4-06
3. **Storage API** → M4-05
4. **Transcript schema** → M5-00, then M5-\* (editor core)
5. **Timeline + media schema** → M6-00, then M6-01–M6-03
6. **Media library** → M6-04, M6-06
7. **Recording** → M6-05
8. **Export jobs** → M6-07
9. **Transcript editing** → M6-08, M6-09, M6-10

Move issues from **Blocked** to **Ready** on the project board when their data dependency is merged.

---

## Out of scope (for now)

Do not create implementation issues for these until design and data exist:

| Item                                           | Reason                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All projects** nav destination               | No design screen                                                                                                                                                                                                          |
| **Templates** nav destination                  | No design screen                                                                                                                                                                                                          |
| **Trash** nav destination                      | No design screen                                                                                                                                                                                                          |
| **Share** button behavior                      | No design for share flow                                                                                                                                                                                                  |
| **New project** flow                           | Design shows CTA but no create-project modal/flow                                                                                                                                                                         |
| **Editor icon rail** tools (except transcript) | Icons shown inactive; no screens designed                                                                                                                                                                                 |
| **Screen / Camera + Screen** record sources    | Design shows tabs; implement after core record works                                                                                                                                                                      |
| **MOV / GIF / 720p / 4K** export variants      | Shell can show options; backend needed per format                                                                                                                                                                         |
| **Accent theme switcher**                      | Design exposes 4 accents (`accentColor`) as a _design-tool_ prop only — no in-app switcher is designed. Build tokens to support theming (derive tints from `--accent`), but ship a single default accent; no switcher UI. |
| **Filler-hint toggle UI**                      | `showFillerHints` is a tool prop with no on-screen control — render filler hints **on** by default; no toggle component.                                                                                                  |
| **Timeline zoom**                              | The `− [slider] +` control (design lines 263–266) has **no zoom logic** in the prototype (purely visual). Render the control in `TimelineToolbar` (M2-12) as inert/visual; do not build zoom math until specified.        |
| **Timeline "Snap" toggle behavior**            | Toggle is shown (line 275) but does nothing in the design — render as a visual `Toggle`; no snapping logic.                                                                                                               |
| **Argo CD / GitOps** for Cutline               | Start with direct `kubectl` CD from GitHub Actions (T-12); Argo Application can follow later.                                                                                                                             |
| **Persistent database on Kubernetes**          | T-11 uses ephemeral SQLite (`emptyDir` / `/tmp`) until CNPG or external DB is specified; SSO/GitHub OAuth secrets deferred to M3+.                                                                                        |

Track these as future epics or product tickets — not as part of the initial Claude design implementation batch.

---

## Design → Svelte translation guide

`design-by-claude/Cutline.dc.html` is **not Svelte** — it is a React/`DCLogic` prototype using a custom template dialect (`sc-if`, `sc-for`, `{{ }}` bindings) with **all styling inline**. Every issue performs the same translation. Follow this mapping so independent agents produce one consistent dialect instead of one per agent.

### Template constructs

| Design construct                                   | Svelte 5 equivalent                                            | Notes                                                                                |
| -------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `<sc-if value="{{ x }}">…</sc-if>`                 | `{#if x}…{/if}`                                                | `hint-placeholder-val` is design-tool noise — ignore it                              |
| paired `sc-if` on `{{ playing }}` / `{{ paused }}` | `{#if playing}…{:else}…{/if}`                                  | design uses two `sc-if`; collapse to one `if/else`                                   |
| `<sc-for list="{{ items }}" as="it">`              | `{#each items as it (it.id)}`                                  | **always keyed** by stable id; never index (AGENTS.md)                               |
| `onClick="{{ fn }}"`                               | `onclick={fn}`                                                 | expose as **callback prop** (`onclick`, `onseek`, `onclose`) — not internal handlers |
| `value="{{ q }}" onInput="{{ fn }}"`               | `bind:value={q}` or `value={q} oninput={fn}`                   | search/input fields                                                                  |
| `ref="{{ recRef }}"`                               | `bind:this={el}`                                               | only the `<video>` in RecordModal needs this                                         |
| `style="{{ x.style }}"` (computed style object)    | **do not port** — compute boolean state, use clsx class arrays | see "Styling" below                                                                  |
| `--accent:{{ accent }}`                            | `--accent` CSS custom property from `tokens.css`               | theme via prop; see token reference                                                  |

### Styling (most important rule)

The design encodes state as **computed inline-style objects** (e.g. `word.style`, `o.style`, `karaokeChip`). **Do not** reproduce computed style strings in Svelte. Instead:

1. Move all literal values (colors, radii, fonts, sizes) into `tokens.css` (M1-01) — see [token reference](#design-tokens-reference-extracted).
2. Write component CSS with **BEM** classes (scoped, in `<style>`).
3. Drive variants with boolean state + **clsx-style class arrays** (AGENTS.md), e.g. a transcript word:

```svelte
<span
	class={[
		'transcript-word',
		{
			'transcript-word--current': isCurrent,
			'transcript-word--selected': isSelected,
			'transcript-word--filler': isFiller && showFiller,
			'transcript-word--deleted': isDeleted,
			'transcript-word--match': isMatch
		}
	]}
	onclick={onselect}
	>{text}
</span>
```

4. Pass dynamic numeric values via the `style:` directive (e.g. `style:--playhead={playheadPct}`, `style:--columns={columns}`), not string concatenation.
5. Style children via CSS custom properties (`<Child --accent="…" />`); fall back to `:global` only when unavoidable.

### Logic / reactivity

| Design (React `DCLogic`)                                                        | Svelte 5                                                            | Issue         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------- |
| `this.state = {…}`                                                              | `$state` (local UI) / `$state.raw` (server payloads)                | per component |
| `renderVals()` computed view-model                                              | `$derived` / `$derived.by`, or pure functions in `editor-derive.ts` | M5-00b        |
| `componentDidMount` + `requestAnimationFrame` loop (lines 594–676)              | `EditorState` class + a single `$effect` for the rAF tick only      | M5-00         |
| `componentDidUpdate` syncing `srcObject`                                        | `$effect` with `bind:this` on `<video>`                             | M6-05         |
| `onKey` global keydown (lines 678–684)                                          | `editor-keyboard.ts` + `svelte:window onkeydown`                    | M6-10         |
| props schema `accentColor` / `captionStyle` / `showFillerHints` (lines 512–514) | typed component/route props with same enums                         | M1-01, M5-09  |

**Reactivity rules (AGENTS.md):** prefer `$derived` over `$effect`; never mutate state inside `$effect` (the rAF tick advancing `currentTime` is the one sanctioned exception). Derive everything else (timecode, playhead %, filler count, caption words) from state.

---

## Design tokens reference (extracted)

Canonical values pulled from `Cutline.dc.html` (helmet lines 14–25 + inline styles). **M1-01 implements this as `src/lib/styles/tokens.css`**; every other issue consumes the variable names — do **not** hardcode hex values in components. Names below are the recommended contract; M1-01 may refine but must publish the final list before M1-04+ start.

### Color — surfaces (darkest → lightest)

| Token              | Value     | Used for                                        |
| ------------------ | --------- | ----------------------------------------------- |
| `--surface-base`   | `#0b0b0d` | app background, on-accent text                  |
| `--surface-0`      | `#0a0a0c` | preview pane                                    |
| `--surface-1`      | `#0c0c0e` | icon rail, timeline                             |
| `--surface-2`      | `#0d0d0f` | transcript panel                                |
| `--surface-3`      | `#0e0e10` | sidebar, top bar                                |
| `--surface-4`      | `#101013` | cards, meta panels, media shelf, storage widget |
| `--surface-5`      | `#131316` | modals                                          |
| `--surface-6`      | `#141417` | inputs, media cards, secondary buttons          |
| `--surface-7`      | `#17171a` | unselected chips / source tabs                  |
| `--surface-active` | `#1a1a1e` | active nav item, active rail tile               |

### Color — borders (darkest → lightest)

| Token            | Value     | Used for                         |
| ---------------- | --------- | -------------------------------- |
| `--border-faint` | `#161619` | timeline track separators        |
| `--border-1`     | `#18181c` | timeline header/label separators |
| `--border-2`     | `#1a1a1e` | rail / transcript borders        |
| `--border-3`     | `#1d1d21` | top bar / sidebar borders        |
| `--border-4`     | `#1f1f24` | card borders, storage track      |
| `--border-5`     | `#232328` | search, hero, transport borders  |
| `--border-6`     | `#26262b` | chips, dividers                  |
| `--border-7`     | `#2a2a30` | modal borders                    |

### Color — text (lightest → faintest)

| Token                | Value     | Used for                    |
| -------------------- | --------- | --------------------------- |
| `--text-bright`      | `#f6f5f2` | search-match text           |
| `--text-1`           | `#f3f2f0` | primary text                |
| `--text-2`           | `#d6d5da` | avatar/transport text       |
| `--text-3`           | `#cfcdd2` | body / transcript text      |
| `--text-4`           | `#b9b8bd` | section labels              |
| `--text-5`           | `#a3a2a8` | muted controls              |
| `--text-6`           | `#8b8a90` | muted text                  |
| `--text-7`           | `#6f6e75` | meta text                   |
| `--text-8`           | `#5f5e66` | faint meta                  |
| `--text-9`           | `#56555c` | ruler / faint timecode      |
| `--text-deleted`     | `#54535b` | struck-through deleted word |
| `--text-placeholder` | `#3f3e45` | empty-state hint text       |

### Color — accent, danger, highlight

| Token                                                              | Value                   | Notes                                                                                                   |
| ------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--accent`                                                         | `#ff6a3d`               | default; **themeable** — options `#7c5cff`, `#2ad1a3`, `#3d7bff` (design prop `accentColor`, lines 512) |
| `--on-accent`                                                      | `#0b0b0d`               | text/icons on accent fills                                                                              |
| `--accent-tint-08` / `-10` / `-12` / `-14` / `-22` / `-32` / `-55` | `rgba(255,106,61,α)`    | tint backgrounds & borders (α as named)                                                                 |
| `--danger`                                                         | `#ff5a4d`               | record dot/button                                                                                       |
| `--danger-text`                                                    | `#ff8478`               | record label text                                                                                       |
| `--on-danger`                                                      | `#160808`               | text on danger fill                                                                                     |
| `--danger-tint-12` / `-14` / `-42` / `-45`                         | `rgba(255,90,77,α)`     | record affordances                                                                                      |
| `--filler`                                                         | `#e6936b`               | filler-word underline color                                                                             |
| `--highlight`                                                      | `rgba(255,214,102,.22)` | search match background                                                                                 |

> Accent/danger tints must be **derived from the accent variable** where possible (e.g. `color-mix(in srgb, var(--accent) 12%, transparent)`) so the 4 themes work without hardcoding orange tints.

### Typography

| Token           | Value                                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| `--font-sans`   | `'Helvetica Neue', Helvetica, Arial, sans-serif`                                 |
| `--font-mono`   | `'JetBrains Mono', monospace` (Google Fonts; preconnect in `app.html`, M1-03)    |
| Weights         | 400, 500, 600, 700                                                               |
| Sizes (px) seen | 8.5, 9.5, 10, 10.5, 11, 12, 12.5, 13, 13.5, 14, 16, 16.5, 17, 18, 19, 21, 26, 84 |

Mono is used for all timecodes, metadata, counts, and labels — wire it through `TimecodeDisplay` (M1-11).

### Radii, z-index, motion, elevation

| Group      | Tokens                                                                                                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radii (px) | `--radius-xs:4`, `--radius-sm:7`, `--radius-md:8`, `--radius-lg:11`, `--radius-xl:13`, `--radius-2xl:16`, `--radius-3xl:18`, `--radius-pill:50%` (design also uses 2,3,5,6,9,10,14 — map to nearest) |
| Z-index    | `--z-playhead:5`, `--z-media-shelf:42`, `--z-export:50`, `--z-record:55`                                                                                                                             |
| Motion     | `@keyframes spin` (`.8s linear infinite`), `@keyframes pulseRec` (`1.4s`/`1.6s infinite`) → M1-02                                                                                                    |
| Elevation  | `--shadow-shelf: 0 20px 50px rgba(0,0,0,.55)`; `--shadow-modal: 0 30px 80px rgba(0,0,0,.6)`                                                                                                          |
| Scrollbar  | thumb `#2a2a2f` (hover `#3a3a40`), 2px solid `--surface-base` border, radius 6 → M1-02                                                                                                               |

### Fixed layout dimensions

| Token             | Value   | Region                |
| ----------------- | ------- | --------------------- |
| `--sidebar-w`     | `240px` | dashboard sidebar     |
| `--topbar-h`      | `54px`  | editor top bar        |
| `--rail-w`        | `54px`  | editor icon rail      |
| `--timeline-h`    | `252px` | timeline dock         |
| `--track-label-w` | `78px`  | timeline track labels |
| `--ruler-h`       | `22px`  | timeline ruler        |

App background is a radial gradient: `radial-gradient(120% 80% at 50% -10%, #131316 0%, #0b0b0d 55%)` (design line 28) → root layout (M1-03).

---

## Shared type contracts

Derived directly from the design's `buildTranscript()` (lines 558–592), `renderVals()` (750–945), and the prop schema (512–514). These are the **single source of truth** for prop shapes and mock/fixture shapes during the UI phase, **before** any DB schema exists. M4-00 / M5-00 / M6-00 formalize them in `src/lib/types/` and may add DB-specific fields, but must not diverge from these names.

> **Important:** the design's view-model objects carry pre-computed **style strings** (`word.style`, `o.style`, chips). Those are a React artifact — the Svelte types below model **domain data + boolean state**, not styles. Variant styling is class-driven (see [translation guide](#design--svelte-translation-guide)).

```ts
// src/lib/types/transcript.ts  (M5-00)
export interface Word {
	id: string; // 'w0', 'w1', …
	text: string; // raw token incl. punctuation, e.g. "um,"
	clean: string; // lowercased, alnum only — for search/filler match
	dur: number; // seconds
	bars: number[]; // 0..1 waveform bar heights for this word
	filler: boolean; // 'um' | 'uh' | "you know" pairs
	deleted: boolean; // soft-delete (toggle, no re-render)
	sid: string; // owning sentence id, 's0', 's1', …
}
export interface Sentence {
	id: string; // 's0', …
	words: Word[];
	t0: number; // start time (seconds)
}
export type CaptionStyle = 'karaoke' | 'clean';
```

```ts
// src/lib/types/media.ts  (M6-00)
export type MediaKind = 'B-roll' | 'Graphic' | 'Recording';
export interface MediaResource {
	id: string;
	name: string;
	dur: number; // seconds
	kind: MediaKind | (string & {});
	thumb: string; // CSS background value (placeholder gradient until real thumbnails)
}
```

```ts
// src/lib/types/timeline.ts  (M6-00)
export interface Overlay {
	// B-roll dropped on the timeline
	id: string;
	resId: string;
	name: string;
	start: number; // seconds (playhead at drop time)
	dur: number;
	thumb: string;
}
export interface Tick {
	leftPct: number;
	label: string;
} // ruler
export interface Clip {
	leftPct: number;
	widthPct: number;
	label: string;
} // V1 / CC blocks
export interface WaveBar {
	leftPct: number;
	widthPct: number;
	heightPct: number;
} // A1
```

> Percentages are modeled as **numbers** here (e.g. `37.5`), not the design's `'37.500%'` strings. Convert to `%` at the template boundary via the `style:` directive.

```ts
// src/lib/types/project.ts  (M4-00)
export interface Project {
	id: string;
	title: string;
	durationLabel: string; // 'durTC' in design, e.g. "4:32"
	kind: string; // 'WEBINAR' | 'INTERVIEW' | … (badge text)
	meta: string; // "Edited 2h ago · 1,142 words · MP4"
	thumb: string; // CSS background value
}
```

```ts
// editor enums (M5-00 / M6-00) — drive modal + record state machines
export type ExportPhase = 'none' | 'config' | 'exporting' | 'done'; // design line 530
export type RecordPhase = 'none' | 'live' | 'countdown' | 'recording' | 'review'; // line 532
export type AccentColor = '#ff6a3d' | '#7c5cff' | '#2ad1a3' | '#3d7bff'; // line 512
```

**`EditorState` (M5-00) fields** (from design `this.state`): `currentTime`, `playing`, `selectedId`, `showCaptions`, `captionStyle`, `query`, `exportPhase`, `exportProgress`, `recordPhase`, `recElapsed`, `recCount`, `camDenied`, `lastResId`, `showMedia`, `resources: MediaResource[]`, `overlays: Overlay[]`, `words: Word[]`, `sentences: Sentence[]`. Methods: `togglePlay`, `toStart`, `toEnd`, `seek`, `selectWord`, `deleteSelected`, `removeFillers`, plus record/export/media actions (design lines 614–741).

---

## Concurrency & file ownership

The 74 implementable issues (M1–M6) are designed for **parallel** independent agents, but several files are touched by **multiple** issues. Uncoordinated parallel work on these will merge-conflict and produce inconsistent results. Treat the files below as **single-owner / serialized** — the second issue may not start until the first is merged.

| Shared file                                     | Issues that touch it               | Rule                                                                                                  |
| ----------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/lib/styles/tokens.css`                     | M1-01 (creates) → consumed by ~all | **Hard gate.** Nothing in M1-04+ / M2 / M4–M6 starts until M1-01 is merged and token names are final. |
| `src/lib/styles/global.css`                     | M1-02 (creates) → consumed by all  | Gate alongside M1-01.                                                                                 |
| `editor/timeline/Timeline.svelte`               | M2-17, M6-02, M6-03, M6-06         | Serialize in that order; one open PR at a time.                                                       |
| `editor/timeline/TimelineTrack.svelte`          | M2-14, M6-06                       | M6-06 after M2-14 merged.                                                                             |
| `editor/transcript/TranscriptWord.svelte`       | M5-02, M6-09                       | M6-09 after M5-02.                                                                                    |
| `editor/transcript/TranscriptPanel.svelte`      | M5-05, M6-08                       | M6-08 after M5-05.                                                                                    |
| `EditorTopBar/TransportControls.svelte`         | M2-09, M5-11                       | M5-11 after M2-09.                                                                                    |
| `src/lib/editor/editor-state.svelte.ts`         | M5-00, M5-11, M6-03, M6-09, M6-10  | M5-00 owns the class; later issues add methods sequentially, not concurrently.                        |
| `src/routes/+page.svelte` / `+page.server.ts`   | exists (default) → M4-04           | M4-04 replaces the SvelteKit default home; expect to delete boilerplate.                              |
| `modals/MediaShelf.svelte` + `MediaCard.svelte` | M2-23, M6-04                       | M6-04 after M2-23.                                                                                    |
| `modals/RecordModal/*`                          | M2-20, M2-21, M6-05                | M6-05 after shells (M2-20/21).                                                                        |
| `modals/ExportModal/*`                          | M2-18, M2-19, M6-07                | M6-07 after shells.                                                                                   |

**Guidance for agents:** before starting an issue, confirm every "Blocked by" issue is **merged** (not just open). For shared files, rebase on `main` immediately before opening the PR. Prefer extracting a new sub-component over editing a hot file when the design allows it.

**Repo cleanup (note, not a blocker):** scaffolding exists at `src/routes/demo/*` and `src/lib/vitest-examples/*`. Keep `demo/` for the M2-25 shells preview; remove `vitest-examples` once T-02/T-03 land real helpers (track as a small chore issue).

---

## GitHub issue mechanics (planning ID → number)

Planning IDs (`M1-04`, `T-01`, `M5-00b`) are **not** GitHub issue numbers. To make dependencies machine-resolvable for independent agents:

1. **Stamp the planning ID** as the first line of every issue body (e.g. `Planning-ID: M1-04`) and as a label (`pid:M1-04`) so it's greppable via `gh issue list --label pid:M1-04`.
2. **Maintain a mapping table** (below) as issues are created; fill the GitHub `#` column. Agents resolve "Blocked by M2-09" → real `#` via this table.
3. **Use native sub-issues / task lists** under the epic so the board reflects the dependency graph.
4. Convert each `Depends on` cell in the [issue inventory](#issue-inventory) into `Blocked by #NN` in the issue body **after** the blocker's number is known (two-pass: create all issues, then link).
5. When the team is ready to execute, issue creation can be scripted with `gh issue create` driven by the inventory tables — but that is an **execution step**, out of scope for this planning doc.

### ID → issue-number map (fill in at creation time)

| Planning ID | GitHub # | Planning ID | GitHub # |
| ----------- | -------- | ----------- | -------- |
| Epic        | \_#\_\_  | M2-13       | \_#\_\_  |
| T-00        | \_#\_\_  | …           | …        |
| T-01        | \_#\_\_  | M5-00       | \_#\_\_  |
| T-02        | \_#\_\_  | M5-00b      | \_#\_\_  |
| M1-01       | \_#\_\_  | …           | …        |

> Keep this table in the **epic issue** (or a pinned project note), not only here, so it stays current as numbers are assigned.

---

## Agent runbook & conventions

This section makes every issue **self-contained for an autonomous coding agent**. An agent assigned one issue should need only: the issue body, this `PLANNING.md`, `AGENTS.md`, and `design-by-claude/`.

### Environment & commands

Package manager is **bun** (see `AGENTS.md`). Standard loop for any issue:

```sh
bun install                      # once per environment
bun run dev                      # local preview at the printed URL
bun run check                    # svelte-check + tsc (must pass — zero errors)
bun run lint                     # prettier --check + eslint (must pass)
bun run format                   # prettier --write (use before committing)
bun run test:unit -- --run       # vitest unit + component (must pass)
bun run test:e2e                 # playwright (only if the issue adds/affects E2E)
```

A PR is mergeable only when `check`, `lint`, and `test:unit -- --run` all pass locally **and** in CI (T-00/T-01).

### Mandatory Svelte MCP step

Per `AGENTS.md`, for **every** `.svelte` / `.svelte.ts` / `.svelte.js` file created or edited:

1. Use `list-sections` + `get-documentation` when implementing runes, snippets, SvelteKit `load`, or any unfamiliar pattern.
2. Run `svelte-autofixer` on each changed file and **repeat until it reports no issues or suggestions**.
3. Do not mark an issue done if autofixer was skipped or still has findings.

Prefer the `svelte-file-editor` subagent for non-trivial `.svelte` work.

### Naming conventions

| Thing           | Convention                                 | Example                                                                            |
| --------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Component file  | `PascalCase.svelte`                        | `ProjectCard.svelte`                                                               |
| Test file       | `<name>.svelte.spec.ts` / `<name>.spec.ts` | `ProjectCard.svelte.spec.ts`                                                       |
| Types / utils   | `kebab-case.ts`                            | `format-timecode.ts`, `editor-state.svelte.ts`                                     |
| BEM block       | kebab-case of the component name           | `ProjectCard` → `.project-card`, `.project-card__title`, `.project-card--selected` |
| CSS custom prop | `--kebab-case` from token reference        | `var(--accent)`, `--playhead`                                                      |
| Callback prop   | `on` + verb                                | `onclick`, `onseek`, `onclose`, `onselect`                                         |

One primary component per file; co-locate its `.spec.ts` and any non-reusable helper. Respect the [file-size limits](#small-organized-files).

### Branching, commits & PRs

| Item           | Convention                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------- |
| Branch         | `feat/<pid>-<slug>` (e.g. `feat/m1-04-button`); `chore/`, `test/`, `fix/` prefixes as appropriate |
| Scope          | **One issue → one branch → one PR.** Do not bundle issues.                                        |
| Commits        | Imperative, present tense; reference the issue (`M1-04: add Button component`)                    |
| PR title       | `<PID>: <summary>` (e.g. `M1-04: Button component`)                                               |
| PR body        | Use the PR template below; link `Closes #NN`                                                      |
| Before opening | Rebase on `main` (critical for [hot files](#concurrency--file-ownership))                         |
| Merge          | Squash; delete branch                                                                             |

Git safety: never force-push `main`, never skip hooks, never commit secrets (`.env`).

### PR template (create as `.github/pull_request_template.md` during execution)

```markdown
## Closes

Closes #<issue> · Planning-ID: <PID>

## What

<1–3 sentences: which design region/component, what this PR delivers>

## Design reference

- `design-by-claude/Cutline.dc.html` lines <range>

## Checklist

- [ ] Matches design tokens (no hardcoded hex) — uses `src/lib/styles/tokens.css`
- [ ] Follows the Design → Svelte translation guide (BEM, clsx variants, keyed `{#each}`)
- [ ] `svelte-autofixer` clean on all changed `.svelte` files
- [ ] `bun run check` + `bun run lint` pass
- [ ] Co-located tests added; `bun run test:unit -- --run` passes
- [ ] **Test quality review** boxes checked (see issue)
- [ ] Coverage meets milestone target on changed lines (or `N/A (pre-T-01)` if merged before the coverage gate lands)
- [ ] File within size limits; split if needed
- [ ] a11y: interactive elements are `<button>`/`<a>` with labels
- [ ] Rebased on `main`; no merge of mocks claimed as "wired" (unless UI-only)
```

### Definition of Done (every issue)

An issue is **Done** only when **all** are true:

1. Code matches the design region (tokens, structure, interaction shell).
2. Translation guide + type contracts honored; no hardcoded hex; no ported inline-style strings.
3. `svelte-autofixer` clean; `bun run check` and `bun run lint` pass.
4. Co-located tests exist, pass, and clear the **Test quality review** bar; coverage target met (or `N/A (pre-T-01)` for PRs merged before the coverage gate **T-01** is green — see T-01 note).
5. PR links the issue, all PR checklist + test-quality boxes ticked, CI green.
6. For `blocked:data` issues: either real `load`/session wired, **or** mocks are documented (`MOCK:` + `TODO(...)`) and the issue stays open / has a follow-up until the backend replaces them.
7. Merged to `main`; board card moved to **Done**.

### Labels (final set)

Extends the [GitHub setup](#github-setup) list:

| Label             | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `pid:<ID>`        | One per planning ID (e.g. `pid:M1-04`) — makes dependencies greppable       |
| `chore`           | Cleanup / infra not tied to a design region (e.g. remove `vitest-examples`) |
| `good-first-task` | Optional: well-isolated `size:small` UI primitives (M1-04…M1-13)            |

Create `pid:*` labels in bulk when issues are generated.

---

## Reading the design file

`design-by-claude/Cutline.dc.html` uses a custom design-tool runtime (`<x-dc>`, `support.js`, `sc-if`/`sc-for`, `{{ }}` bindings, a `DCLogic`/React class). **It will not render as a normal web page** without that tool — do **not** try to `bun run dev` it or screenshot it for reference.

How agents should use it:

1. **Read the source directly** for structure, layout, exact values, and copy.
2. **Markup/layout** lives in the `<x-dc>` block (lines ~28–508), grouped by the `<!-- ===== SECTION ===== -->` comments and the [design → component map](#design--component-map).
3. **Behavior, data shapes, and computed values** live in the `<script type="text/x-dc">` `Component` class (lines ~516–947): `buildTranscript()` (sample data + shapes), `renderVals()` (the view-model/derivation math), and the action methods (`togglePlay`, `deleteSelected`, `runExport`, recording flow, etc.).
4. **Tokens** come from the [token reference](#design-tokens-reference-extracted); **types** from the [type contracts](#shared-type-contracts) — both already extracted from this file so agents don't re-derive them.
5. Sample copy/text in the design (transcript script, project titles, "Alex Chen") is **placeholder** — move it to `src/lib/mocks/` with `MOCK:`/`TODO(...)`, never hardcode in components.

---

## Summary for team lead

| Metric                                          | Count                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Total planned issues                            | **85** (1 epic + 10 test/CI-safety infra + 74 implementable)                                   |
| Ready to start now (M0 + M1 + M2 + M3 + M5-00b) | **53** (M0:10 + M1:14 + M2:25 + M3:3 + M5-00b:1)                                               |
| Blocked on data (M4 + M5 + M6, excl. M5-00b)    | **31** (M4:7 + M5:13 + M6:11) — UI may use `$lib/mocks/`; issue closes when real backend wired |
| Buckets reconcile                               | 53 ready + 31 blocked = **84 work issues**; + 1 epic = **85 total**                            |
| Milestones                                      | **7** (M0–M6)                                                                                  |
| Co-located test files                           | **Required on every component/util PR**                                                        |
| Coverage gate                                   | **≥ 80% overall `src/lib/**` (CI via T-01)\*\*                                                 |
| Consistency anchors                             | **Tokens, type contracts, translation guide** must be honored by every agent                   |

**Recommended actions:**

1. Create GitHub Project **Cutline UI** with columns listed above.
2. Create labels (include `testing` and per-issue `pid:*` labels — see [issue mechanics](#github-issue-mechanics-planning-id--number)).
3. Create milestones M0–M6.
4. Create epic issue linking to this document; paste the **ID → number map** into it.
5. **Create T-00 (base CI) and T-01–T-03 first** (CI + test infra before the component flood).
6. **Gate on M1-01 (tokens) + M1-02 (global) merging** before any other component issue starts — see [Concurrency & file ownership](#concurrency--file-ownership).
7. Batch-create M1 and M2 issues — paste **Template A**; every issue includes **Test quality review** section and links the [translation guide](#design--svelte-translation-guide).
8. Create M4–M6 issues in **Blocked** with **Template B**.
9. Add backend epic for schemas; link as blockers from M4-00, M5-00, M6-00.
10. PR template: link issue + confirm **Test quality review** checkboxes + coverage pass.

---

_Final — ready for GitHub issue generation. Aligned with `AGENTS.md`, `design-by-claude/Cutline.dc.html`, `package.json`/`vite.config.ts`. Includes extracted tokens, type contracts, translation guide, agent runbook, and concurrency rules so each generated issue is self-contained for an autonomous coding agent._

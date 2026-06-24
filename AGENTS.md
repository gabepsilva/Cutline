## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **CSS**: BEM (Block Element Modifier) — use BEM naming for all component and page styles
- **Add-ons**: prettier, eslint, vitest, playwright, drizzle, better-auth, mcp

---

## Agent requirements — Svelte MCP (mandatory)

This is a **Svelte 5 / SvelteKit** project. Any agent (LLM) that **creates, edits, reviews, or analyzes** a `.svelte` file or `.svelte.ts` / `.svelte.js` module **MUST** use the **Svelte MCP server** (`user-svelte` / `plugin-svelte-svelte`). Do not rely on memory alone for Svelte APIs or syntax.

### Required workflow

| Step | When                                            | MCP tool                                                                |
| ---- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| 1    | Starting Svelte/SvelteKit work or unsure of API | `list-sections` → `get-documentation` for relevant sections             |
| 2    | Before finishing any `.svelte` change           | `svelte-autofixer` — repeat until **no issues or suggestions**          |
| 3    | User asks for playground only                   | `playground-link` (after confirmation; never for files written in-repo) |

### Rules

- **MUST** call `svelte-autofixer` on every Svelte file you write or edit before marking the task done.
- **MUST** use `list-sections` + `get-documentation` when implementing runes, snippets, SvelteKit `load`, or unfamiliar patterns.
- **MUST NOT** ship Svelte code that failed autofixer or was not checked.
- Prefer the `svelte-file-editor` subagent for non-trivial `.svelte` work when available.

Tool schemas live in the MCP descriptors; read them before calling.

---

## Coding Conventions

### Svelte 5 (runes & reactivity)

- Use `$state` only for variables that are actually reactive. For large objects that are reassigned rather than mutated (e.g. API responses), use `$state.raw` to avoid proxy overhead.
- Prefer `$derived` (or `$derived.by`) over `$effect` for computed values. Treat `$effect` as an escape hatch and never update state inside it.
- Treat props as mutable — derive values from them with `$derived` instead of computing once.

### Modern syntax (avoid legacy)

- Use `$props()` not `export let` / `$$props` / `$$restProps`.
- Use `onclick={...}` not `on:click={...}`.
- Use `{#snippet ...}` / `{@render ...}` not `<slot>` / `<svelte:fragment>`.
- Use `{@attach ...}` not `use:action`.
- Share reactive state with classes using `$state` fields instead of stores.
- Use clsx-style arrays/objects in `class` instead of the `class:` directive.

### Templates

- Always use keyed `{#each}` blocks; never use the index as the key.

### Styling

- Write all CSS using **BEM** naming (see Project Configuration).
- Styles are scoped by default. Style child components via CSS custom properties (`<Child --color="red" />`), falling back to `:global` only when unavoidable.
- Pass JS values into CSS with the `style:` directive (e.g. `style:--columns={columns}`).

### SvelteKit

- Prefer server `load` functions and database joins to avoid request waterfalls; don't chain dependent fetches in the browser.
- Give every page a unique, descriptive `<title>` and `<meta name="description">` in `<svelte:head>` (accessibility + SEO).
- Keep SSR on unless there's a good reason not to, and set the correct `<html lang>`.

### Mock data (temporary)

Mock data is **allowed** when the real backend, service, or third-party integration is not ready yet. Use it to build and preview UI against the design.

**Requirements:**

- Every mock must have a **comment** explaining what it stands in for and that it is temporary.
- Every mock must include a **`TODO` comment** naming what replaces it: `TODO(data)`, `TODO(backend)`, `TODO(service)`, or `TODO(3p)`.
- Prefer **centralized mocks** in `src/lib/mocks/` (e.g. `projects.mock.ts`) — not scattered magic values in components.
- Components stay **presentational**: receive props; routes/`load` or parent pages supply mock or real data.
- **Tests** use `src/lib/test/fixtures/` — not production mock modules (fixtures are for tests only).

**Example:**

```ts
// MOCK: Sample projects for dashboard UI until the projects table exists.
// TODO(backend): Replace with drizzle query in `+page.server.ts` (M4-04).
import { mockProjects } from '$lib/mocks/projects.mock';
```

Remove mocks when the corresponding `TODO` is resolved. Do not leave undocumented hardcoded data.

### File and component organization

Keep files small and single-purpose. Large monolithic components are hard to review, test, and reuse. Split by visual region or concern — not only when a line count is hit.

**Size guidelines:**

| File type                                  | Target (aim here) | Hard ceiling (split before merging) |
| ------------------------------------------ | ----------------- | ----------------------------------- |
| Route `+page.svelte`                       | ~50–80 lines      | ~120 lines                          |
| Leaf UI component                          | ~80–150 lines     | ~250 lines                          |
| Layout / orchestrator (mostly composition) | ~60–100 lines     | ~150 lines                          |
| Complex widget (e.g. timeline track)       | ~100–200 lines    | ~300 lines                          |
| `.ts` utils / types                        | ~100–200 lines    | ~300 lines                          |

Auto-generated files are exempt. Routes and layouts compose components — they do not contain large markup blocks or business logic.

**Structure:**

- One primary component per file. Co-locate tiny private helpers only when they are not reusable elsewhere.
- Pages and layouts compose components; they do not contain large markup blocks or business logic.
- Group by domain under `src/lib/components/` (e.g. `ui/`, `layout/`, `dashboard/`, `editor/`).
- Put shared types and pure functions in sibling `.ts` files (e.g. `Timeline.types.ts`, `format-timecode.ts`), not inside large `.svelte` files.
- Prefer a folder per complex component when it has sub-parts: `Timeline/Timeline.svelte`, `Timeline/TimelineRuler.svelte`, `Timeline/TimelineTrack.svelte`.

**When to extract a new component or file:**

- A distinct visual region from the design (sidebar, top bar, transcript row, modal step)
- Markup repeated more than once
- A section that would be easier to reason about or test in isolation
- Any block that would push the parent file past the target or hard ceiling

**PR scope:** one component or one small, related group (e.g. `Button` + `IconButton`). Do not land whole screens in a single PR unless the screen is only wiring existing pieces together.

**Rule of thumb:** if you cannot describe the file in one short phrase, or a new contributor cannot find what they need quickly, split it — even when under the target.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **CSS**: BEM (Block Element Modifier) — use BEM naming for all component and page styles
- **Add-ons**: prettier, eslint, vitest, playwright, drizzle, better-auth, mcp

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

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

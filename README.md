# Cutline

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.16.1 create --template minimal --types ts --add prettier eslint vitest="usages:unit,component" playwright drizzle="database:sqlite+sqlite:libsql" better-auth="demo:password,github" mcp="ide:cursor,claude-code,other+setup:local" --install bun Cutline
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
bun run build
```

You can preview the production build with `bun run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## CI

Every PR to `master` must pass the workflows in `.github/workflows/`:

| Check             | Workflow       | Local equivalent                                                   |
| ----------------- | -------------- | ------------------------------------------------------------------ |
| Code quality      | `ci.yml`       | `prettier --check`, `eslint`, `check`, `test:unit`, Playwright e2e |
| Coverage          | `ci.yml`       | `bun run test:unit:coverage`                                       |
| Secret scanning   | `security.yml` | — (gitleaks in CI)                                                 |
| Dependency audit  | `security.yml` | `bash scripts/ci/audit-deps.sh`                                    |
| Dependency review | `security.yml` | — (PR-only, GitHub-hosted)                                         |
| CodeQL            | `codeql.yml`   | —                                                                  |
| Build verify      | `build.yml`    | `bun run build`                                                    |

Trusted PRs (same repo) and pushes run on the self-hosted runner `cutline-runner-1`; fork PRs use `ubuntu-latest`. See `PLANNING.md` → CI/CD pipeline for the full design.

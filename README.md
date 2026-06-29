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

Install dependencies and start the Vite dev server (app only — jobs run in-process unless `INLINE_JOB_WORKER=false`):

```sh
bun install
bun run dev

# open the app in a new browser tab
bun run dev -- --open
```

For **production-like topology** (separate app + worker, ffmpeg ingest, shared DB), use the Docker Compose dev stack:

```sh
cp .env.example .env   # set BETTER_AUTH_SECRET (32+ chars) and any optional API keys
make dev-up            # foreground; or make dev-up-d for detached
```

| Target                                         | Description                                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `make dev-up` / `make dev-up-d`                | Start app (`:5173`) + worker + migrate                                                              |
| `make dev-down`                                | Stop containers                                                                                     |
| `make dev-logs`                                | Tail service logs                                                                                   |
| `make dev-migrate`                             | Re-run schema migrations                                                                            |
| `make dev-rebuild`                             | Rebuild images after `Dockerfile.dev` or lockfile changes                                           |
| `make dev-ui`                                  | Open [lazydocker](https://github.com/jesseduffield/lazydocker) TUI (`pacman -S lazydocker` on Arch) |
| `make dev-shell-app` / `make dev-shell-worker` | Shell into a running service                                                                        |

**Prerequisites:** Docker Engine + Compose v2, `.env` from `.env.example`.

**How it works:** `compose.yaml` bind-mounts the repo, keeps `node_modules` in a named volume (Linux-native `@libsql` bindings), and stores SQLite at `file:/data/local.db` in a shared volume. The app uses `DOCKER_DEV=1` for Vite polling so HMR works across bind mounts. `INLINE_JOB_WORKER=false` — the worker service polls the DB like production.

**Pitfalls:** After `bun.lock` changes, restart compose or run `make dev-rebuild`. Upload/transcription need R2/AssemblyAI keys in `.env`; the UI loads without them.

Keep lint, typecheck, and unit tests on the host: `bun run check`, `bun run test:unit -- --run`.

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
| Secret scanning   | `security.yml` | `bash scripts/ci/gitleaks.sh` (requires full git history)          |
| Dependency audit  | `security.yml` | `bash scripts/ci/audit-deps.sh`                                    |
| Dependency review | `security.yml` | — (PR-only, GitHub-hosted)                                         |
| CodeQL            | `codeql.yml`   | —                                                                  |
| Build verify      | `build.yml`    | `bun run build`                                                    |

Trusted PRs (same repo) and pushes run on the self-hosted runner `cutline-runner-1`; fork PRs use `ubuntu-latest`. See `PLANNING.md` → CI/CD pipeline for the full design.

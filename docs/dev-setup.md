# Developer setup

## R2 bucket config (Wrangler)

Cutline stores media in the private Cloudflare R2 bucket **`cutline-prod`**. Browser uploads (#138) need bucket **CORS**; abandoned multipart uploads are cleaned by a **lifecycle** rule. Both are codified in `infra/r2/` and applied with Wrangler — not dashboard-only state.

Wrangler is a **dev dependency** (`bun add -d wrangler`). The app runtime uses the S3 SDK with R2 access keys from 1Password; it does **not** use Wrangler.

### Prerequisites

- [Bun](https://bun.sh) and repo dependencies (`bun install --frozen-lockfile`)
- [1Password CLI](https://developer.1password.com/docs/cli/) (`op`) with access to the shared dev item
- A Cloudflare **API token** (`cfat_…`) with **R2 edit + bucket settings** (not the S3 access key used by the app)

Store these in 1Password (Dev vault), shared across both dev machines:

| Variable                | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler auth (bucket CORS/lifecycle + object list/get) |
| `CLOUDFLARE_ACCOUNT_ID` | `83cb45a0b6add1ac05003e09ba101220`                      |

Never commit token values — this repo is public.

### Apply bucket config

From the repo root, with credentials in the environment:

```sh
export CLOUDFLARE_API_TOKEN="$(op read 'op://…/CLOUDFLARE_API_TOKEN')"
export CLOUDFLARE_ACCOUNT_ID="$(op read 'op://…/CLOUDFLARE_ACCOUNT_ID')"
bash scripts/r2-bucket-config.sh
```

Or inject from a local env file (gitignored):

```sh
op run --env-file=.env.r2.local -- bash scripts/r2-bucket-config.sh
```

The script applies:

- **`infra/r2/cors.json`** — `PUT`/`GET` from `https://cutline.i.psilva.org` and `http://localhost:5173`; exposes `ETag` for multipart (#138)
- **`infra/r2/lifecycle.json`** — abort incomplete multipart uploads after 1 day (#138 orphan handling)

Re-run after changing either JSON file. Verify Wrangler is available:

```sh
bunx wrangler --version
```

Optional: `wrangler.jsonc` pins `account_id` so you can omit `CLOUDFLARE_ACCOUNT_ID` when it matches.

### Debug ingest / uploads

List objects under a media prefix (after #138/#139):

```sh
op run --env-file=.env.r2.local -- \
  bunx wrangler r2 object list cutline-prod --prefix 'users/<userId>/projects/<projectId>/media/<mediaId>/'
```

Fetch metadata or download a derived asset:

```sh
bunx wrangler r2 object get cutline-prod users/.../transcode.mp4 --file /tmp/transcode.mp4
```

Use the S3 access key (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` in `Cutline-PROD` dotenv) for app-side presigned URLs — not the Cloudflare API token.

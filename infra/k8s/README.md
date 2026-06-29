# Cutline — Kubernetes deploy (`tk8s`)

| Environment | URL                                   | Namespace      | Argo app       | Deploy branch                               |
| ----------- | ------------------------------------- | -------------- | -------------- | ------------------------------------------- |
| Staging     | **https://cutline-stag.i.psilva.org** | `cutline-stag` | `cutline-stag` | `deploy/stag` (auto on `master` merge)      |
| Production  | **https://cutline.i.psilva.org**      | `cutline`      | `cutline-prod` | `deploy/prod` (manual **Promote** workflow) |

Both run on the `tk8s` homelab cluster behind nginx ingress + cert-manager TLS
(`letsencrypt-dns01`).

Layout (kustomize + Argo CD GitOps, T-13 / #216):

```
infra/k8s/
  argocd/          one-time Application registration (cutline-stag, cutline-prod)
  base/            namespace, configmap, OnePasswordItems, deployment, migrate hook/job, service, certificate, ingress
  overlays/stag/   staging host + per-env ConfigMap overrides + image tag (CI pins newTag on deploy/stag)
  overlays/prod/   prod image tag (CI pins newTag on deploy/prod via Promote workflow)
```

## Runtime contract

| Source                     | Keys                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| ConfigMap `cutline-config` | `ORIGIN`, `PORT`; staging also sets `DATABASE_URL`, `R2_*` (per-env overrides, #216)     |
| Secret `cutline-app`       | `dotenv` blob — mounted at `/app/.env`; Bun auto-loads it at startup (see **1Password**) |
| Secret `cutline-regcred`   | `kubernetes.io/dockerconfigjson` — GHCR image pulls                                      |

**Staging data isolation (#216):** `cutline-stag` reuses the prod `Cutline-PROD` 1Password item
(same R2 keys, auth secret, OAuth). Per-env values are overridden in the stag ConfigMap
(`DATABASE_URL`, `R2_BUCKET`, `R2_PUBLIC_*`, `ORIGIN`). Migrate hook Jobs also patch
`DATABASE_URL` from the ConfigMap (they mount dotenv only — without the patch, PreSync
would hit the prod Turso DB).

The image (`@sveltejs/adapter-node`) listens on `0.0.0.0:3000` and serves the K8s probe
at `GET /healthz`. Database schema is applied by a **PreSync migrate Job** before each
deploy (see **Migrations**), not on every pod start.

> **Persistent DB:** production uses **Turso** (`libsql://…`) with credentials in the
> `Cutline-PROD` dotenv blob. Local dev and CI stay on `file:local.db` / `file:./ci-e2e.db`.

## 1Password operator

Secrets are synced by the cluster's **1Password operator** (`OnePasswordItem` CRDs in
`base/`). No manual `kubectl create secret` for app or registry credentials.

All secrets live in **one** 1Password item, `Cutline-PROD`; each `OnePasswordItem` CRD syncs
it into a separate K8s Secret (every field syncs to both, so each Secret carries one unused
extra key — harmless):

| 1Password item (homelab7) | K8s Secret        | Field used          |
| ------------------------- | ----------------- | ------------------- |
| `Cutline-PROD`            | `cutline-app`     | `dotenv`            |
| `Cutline-PROD`            | `cutline-regcred` | `.dockerconfigjson` |

The `dotenv` field holds `KEY=value` lines. The operator syncs it to Secret key `dotenv`,
the Deployment mounts it as `/app/.env`, and **Bun auto-loads `.env` from the working dir
(`/app`)** at startup — no loader script, no per-key fields:

```dotenv
BETTER_AUTH_SECRET=<32+ chars>
DATABASE_URL=libsql://cutline-prod-gabrielpe.aws-us-east-1.turso.io
DATABASE_AUTH_TOKEN=<db-scoped turso token>
```

**Precedence:** Bun's `.env` does **not** override real environment variables, so ConfigMap
env wins on a conflict for keys present in both (e.g. `ORIGIN`, `PORT`). `DATABASE_URL` is
**not** in the ConfigMap — Turso credentials come from dotenv only.

Refresh `spec.itemPath` in the YAML if an item is recreated:

```sh
op item get "Cutline-PROD" --vault homelab7 --format json \
  | jq -r '"vaults/" + .vault.id + "/items/" + .id'
```

Verify sync:

```sh
kubectl -n cutline get onepassworditems
kubectl -n cutline get secret cutline-app -o jsonpath='{.data}' | jq 'keys'
```

## Argo CD (T-13 / #216)

| App            | Overlay         | Branch        | Sync                     |
| -------------- | --------------- | ------------- | ------------------------ |
| `cutline-stag` | `overlays/stag` | `deploy/stag` | auto (CI on `master`)    |
| `cutline-prod` | `overlays/prod` | `deploy/prod` | auto (CI on **Promote**) |

Each deploy branch is a CI-managed pointer: latest `master` plus the pinned `images.newTag`.
`master` stays review-gated; only unprotected deploy branches are force-pushed by CI.
Both Applications use automated sync with `prune` + `selfHeal`.

**One-time registration** (after Argo CD is installed on tk8s). Seed each deploy branch,
then register:

```sh
git push origin master:refs/heads/deploy/stag   # seed staging (once)
git push origin master:refs/heads/deploy/prod   # seed prod (once)
kubectl apply -f infra/k8s/argocd/cutline-stag-app.yaml
kubectl apply -f infra/k8s/argocd/cutline-prod-app.yaml
kubectl -n argocd get application cutline-stag cutline-prod
```

Status checks:

```sh
kubectl -n argocd get application cutline-stag \
  -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'
kubectl -n argocd get application cutline-prod \
  -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'
```

Deploy flow (#216):

```
master merge → deploy.yml: build artifact → push GHCR → pin deploy/stag → Argo cutline-stag → /healthz

manual Promote workflow → pin same tag on deploy/prod → Argo cutline-prod → /healthz
```

The deploy/promote jobs wait for Argo to report **the pushed deploy-branch revision** as
`Synced` + `Healthy` with `operationState=Succeeded`.

**Rollback:** re-pin the desired tag on the deploy branch (re-run Promote for prod, or
re-run deploy for staging), or use Argo history (`argocd app rollback cutline-prod`).
With `selfHeal: true`, manual drift is reverted to match git.

Preview/ephemeral envs stay **out of Argo** — CI-managed only.

## Migrations

Schema changes ship in `drizzle/` and are applied **once per deploy** via an Argo CD
PreSync hook Job — not in the web pod entrypoint. This is multi-replica safe and ensures
the new schema is in place before pods roll out.

| Resource                                    | Role                                              |
| ------------------------------------------- | ------------------------------------------------- |
| Job `cutline-migrate-hook` (PreSync hook)   | Runs on every Argo sync with the synced image tag |
| CronJob `cutline-migrate` (`suspend: true`) | Manual Job template only — never scheduled        |

The migrate pod mounts `cutline-app` → `/app/.env` **only** (no ConfigMap `envFrom`). Bun
auto-loads Turso `DATABASE_URL` + `DATABASE_AUTH_TOKEN` from dotenv. A failed PreSync
migrate **blocks** the sync — the Deployment does not roll.

Manual migrate with a specific image tag (outside Argo):

```sh
TAG=ghcr.io/gabepsilva/cutline:<date>_<run>
kubectl -n cutline set image cronjob/cutline-migrate migrate="${TAG}"
kubectl -n cutline create job cutline-migrate-manual --from=cronjob/cutline-migrate
kubectl -n cutline wait --for=condition=complete job/cutline-migrate-manual --timeout=120s
```

**Rollback:** not a concern pre-launch — Turso holds no production data yet. To revert the
cutover, redeploy the previous image tag (re-pin `newTag` on `deploy/prod`). Note: re-adding
`DATABASE_URL=file:…` to the ConfigMap is **not** a valid rollback — the entrypoint no longer
migrates, so web pods would start against an empty, unmigrated SQLite and fail on first query.

## Bootstrap

Before Argo is registered, you can apply the overlay directly:

```sh
kubectl apply -k infra/k8s/overlays/prod
kubectl apply -k infra/k8s/overlays/stag
```

After GitOps cutover, Argo owns the overlay — use the Application registration above instead.

**TLS / cert-manager (#218):** the base Ingress carries `cert-manager.io/cluster-issuer`,
which makes cert-manager's ingress-shim auto-create a `Certificate` named after
`spec.tls.secretName`. Staging keeps the base `Certificate` name (`cutline-tls`) but patches
`secretName` to `cutline-stag-tls` — without dropping the annotation, shim creates a second
`Certificate/cutline-stag-tls` that fights over the same secret. The stag ingress overlay
patch removes the `cert-manager.io/cluster-issuer` annotation (JSON6902 `op: remove`) so only
the explicit `Certificate` remains.

**Manual-apply leftovers:** resources created by `kubectl apply -k` before Argo registration
carry no Argo tracking annotation, so `prune: true` will **not** remove renamed/dropped
resources. Audit and remove orphans so the overlay stays the single source of truth:

```sh
# List orphans (exit 1 if any found)
bash scripts/k8s-audit-overlay.sh cutline-stag infra/k8s/overlays/stag

# Delete orphans (prompts per resource before each delete)
bash scripts/k8s-audit-overlay.sh cutline-stag infra/k8s/overlays/stag --delete
```

Wait for `OnePasswordItem` resources to reach `Ready=True` and secrets to populate before
the Deployment can start cleanly.

## Deploys

| Workflow      | Trigger                         | Target                     |
| ------------- | ------------------------------- | -------------------------- |
| `deploy.yml`  | merge to `master` (path filter) | staging (`deploy/stag`)    |
| `promote.yml` | manual `workflow_dispatch`      | production (`deploy/prod`) |

`deploy.yml` builds one versioned artifact (`ghcr.io/gabepsilva/cutline:<date>_<run>`),
scans it, pushes with provenance, and deploys to staging. `promote.yml` ships the **same**
tag already verified in staging — no rebuild.

## Verify

```sh
# Staging
INGRESS_IP=$(kubectl -n cutline-stag get ingress cutline -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -fsS --resolve cutline-stag.i.psilva.org:443:"$INGRESS_IP" https://cutline-stag.i.psilva.org/healthz

# Production
INGRESS_IP=$(kubectl -n cutline get ingress cutline -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -fsS --resolve cutline.i.psilva.org:443:"$INGRESS_IP" https://cutline.i.psilva.org/healthz
```

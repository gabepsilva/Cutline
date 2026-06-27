# Cutline — Kubernetes deploy (`tk8s`)

Production target: **https://cutline.i.psilva.org** on the `tk8s` homelab cluster,
namespace `cutline`, behind nginx ingress + cert-manager TLS (`letsencrypt-dns01`).

Layout (kustomize + Argo CD GitOps, T-13):

```
infra/k8s/
  argocd/          one-time Application registration (cutline-prod)
  base/            namespace, configmap, OnePasswordItems, deployment, migrate hook/job, service, certificate, ingress
  overlays/prod/   namespace + authoritative image tag (CI commits newTag)
```

## Runtime contract

| Source                     | Keys                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| ConfigMap `cutline-config` | `ORIGIN=https://cutline.i.psilva.org`, `PORT=3000`                                       |
| Secret `cutline-app`       | `dotenv` blob — mounted at `/app/.env`; Bun auto-loads it at startup (see **1Password**) |
| Secret `cutline-regcred`   | `kubernetes.io/dockerconfigjson` — GHCR image pulls                                      |

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

## Argo CD (T-13)

Cluster state tracks `infra/k8s/overlays/prod` in git. The `cutline-prod` Application
uses automated sync with `prune` + `selfHeal` — git is the single source of truth for the
running image tag and manifests.

**One-time registration** (after Argo CD is installed on tk8s):

```sh
kubectl apply -f infra/k8s/argocd/cutline-prod-app.yaml
kubectl -n argocd get application cutline-prod
```

Status checks:

```sh
kubectl -n argocd get application cutline-prod \
  -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'
```

Deploy flow (`.github/workflows/deploy.yml`):

```
build → push → commit images.newTag → Argo sync (PreSync migrate Job → Deployment) → curl /healthz
```

**Rollback:** revert the `newTag` commit on `master` (or use Argo history). With
`selfHeal: true`, manual drift (e.g. `kubectl set image …`) is reverted to match git.

Preview/ephemeral envs stay **out of Argo** — CI-managed only.

## Migrations

Schema changes ship in `drizzle/` and are applied **once per deploy** via an Argo CD
PreSync hook Job — not in the web pod entrypoint. This is multi-replica safe and ensures
the new schema is in place before pods roll out.

| Resource                                    | Role                                              |
| ------------------------------------------- | ------------------------------------------------- |
| Job `cutline-migrate` (PreSync hook)        | Runs on every Argo sync with the synced image tag |
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
cutover, redeploy the previous image tag (revert the `newTag` commit). Note: re-adding
`DATABASE_URL=file:…` to the ConfigMap is **not** a valid rollback — the entrypoint no longer
migrates, so web pods would start against an empty, unmigrated SQLite and fail on first query.

## Bootstrap

Before Argo is registered, you can apply the overlay directly:

```sh
kubectl apply -k infra/k8s/overlays/prod
```

After GitOps cutover, Argo owns the overlay — use the Application registration above instead.

Wait for `OnePasswordItem` resources to reach `Ready=True` and secrets to populate before
the Deployment can start cleanly.

## Deploys

Continuous delivery is handled by `.github/workflows/deploy.yml` (T-13): on merge to
`master` it builds + pushes `ghcr.io/gabepsilva/cutline:<date>_<run>`, commits the tag to
`overlays/prod/kustomization.yaml`, and waits for Argo CD to sync (PreSync migrate →
Deployment rollout).

Manual rollout of a specific tag (revert or bump `newTag` in git and push, or use Argo UI).

## Verify

```sh
INGRESS_IP=$(kubectl -n cutline get ingress cutline -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -fsS --resolve cutline.i.psilva.org:443:"$INGRESS_IP" https://cutline.i.psilva.org/healthz
```

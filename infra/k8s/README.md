# Cutline — Kubernetes deploy (`tk8s`)

Production target: **https://cutline.i.psilva.org** on the `tk8s` homelab cluster,
namespace `cutline`, behind nginx ingress + cert-manager TLS (`letsencrypt-dns01`).

Layout (kustomize):

```
infra/k8s/
  base/            namespace, configmap, OnePasswordItems, deployment, service, certificate, ingress
  overlays/prod/   namespace + image tag pin
```

## Runtime contract

| Source                     | Keys                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| ConfigMap `cutline-config` | `ORIGIN=https://cutline.i.psilva.org`, `PORT=3000`, `DATABASE_URL=file:/tmp/cutline.db`  |
| Secret `cutline-app`       | `dotenv` blob — mounted at `/app/.env`; Bun auto-loads it at startup (see **1Password**) |
| Secret `cutline-regcred`   | `kubernetes.io/dockerconfigjson` — GHCR image pulls                                      |

The image (`@sveltejs/adapter-node`) listens on `0.0.0.0:3000`, applies drizzle
migrations at startup, and serves the K8s probe at `GET /healthz`.

> **Ephemeral data:** the database is SQLite on the pod's `emptyDir` `/tmp` — it is
> wiped on every restart. A persistent DB and GitHub OAuth are deferred (see PLANNING.md).

## 1Password operator

Secrets are synced by the cluster's **1Password operator** (`OnePasswordItem` CRDs in
`base/`). No manual `kubectl create secret` for app or registry credentials.

| 1Password item (homelab7)              | K8s Secret        | Field / type                |
| -------------------------------------- | ----------------- | --------------------------- |
| `Cutline-PROD`                         | `cutline-app`     | text field labeled `dotenv` |
| `GHCR pull cutline kubernetes`         | `cutline-regcred` | `.dockerconfigjson`         |

The `dotenv` field holds `KEY=value` lines. The operator syncs it to Secret key `dotenv`,
the Deployment mounts it as `/app/.env`, and **Bun auto-loads `.env` from the working dir
(`/app`)** at startup — no loader script, no per-key fields:

```dotenv
BETTER_AUTH_SECRET=<32+ chars>
# DATABASE_URL=libsql://…        (stage for #129; ignored until removed from ConfigMap)
# DATABASE_AUTH_TOKEN=<turso token>   (stage for #129)
```

**Precedence:** Bun's `.env` does **not** override real environment variables, so ConfigMap
env wins on a conflict. ConfigMap's `DATABASE_URL=file:/tmp/cutline.db` therefore overrides
any Turso `DATABASE_URL` staged in the blob until #129 drops it from the ConfigMap.

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

## Bootstrap

```sh
kubectl apply -k infra/k8s/overlays/prod
```

Wait for `OnePasswordItem` resources to reach `Ready=True` and secrets to populate before
the Deployment can start cleanly.

## Deploys

Continuous delivery is handled by `.github/workflows/deploy.yml` (T-12): on merge to
`master` it builds + pushes `ghcr.io/gabepsilva/cutline:<date>_<run>`, then:

```sh
kubectl -n cutline set image deployment/cutline cutline=ghcr.io/gabepsilva/cutline:<tag>
kubectl -n cutline rollout status deployment/cutline --timeout=300s
```

Manual rollout of a specific tag:

```sh
kubectl -n cutline set image deployment/cutline cutline=ghcr.io/gabepsilva/cutline:<tag>
```

## Verify

```sh
INGRESS_IP=$(kubectl -n cutline get ingress cutline -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl -fsS --resolve cutline.i.psilva.org:443:"$INGRESS_IP" https://cutline.i.psilva.org/healthz
```

# Cutline — Kubernetes deploy (`tk8s`)

Production target: **https://cutline.i.psilva.org** on the `tk8s` homelab cluster,
namespace `cutline`, behind nginx ingress + cert-manager TLS (`letsencrypt-dns01`).

Layout (kustomize):

```
infra/k8s/
  base/            namespace, configmap, deployment, service, certificate, ingress
  overlays/prod/   namespace + image tag pin
```

## Runtime contract

| Source                     | Keys                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------- |
| ConfigMap `cutline-config` | `ORIGIN=https://cutline.i.psilva.org`, `PORT=3000`, `DATABASE_URL=file:/tmp/cutline.db` |
| Secret `cutline-app`       | `BETTER_AUTH_SECRET` (32+ chars)                                                        |

The image (`@sveltejs/adapter-node`) listens on `0.0.0.0:3000`, applies drizzle
migrations at startup, and serves the K8s probe at `GET /healthz`.

> **Ephemeral data:** the database is SQLite on the pod's `emptyDir` `/tmp` — it is
> wiped on every restart. A persistent DB and GitHub OAuth are deferred (see PLANNING.md).

## One-time bootstrap

```sh
# 1) Namespace + manifests
kubectl apply -k infra/k8s/overlays/prod

# 2) App secret (NOT in git) — generate a strong value once
kubectl -n cutline create secret generic cutline-app \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -base64 32)"

# 3) GHCR pull secret — required (the ghcr.io/gabepsilva/cutline package is private,
#    and the Deployment references imagePullSecrets: [cutline-regcred]).
kubectl -n cutline create secret docker-registry cutline-regcred \
  --docker-server=ghcr.io --docker-username=<gh-user> --docker-password=<token-with-read:packages>
```

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

# Observability

Cutline observability is delivered in two phases:

- **Phase 1** — Structured pino access and job logs (`requestId`, job lifecycle lines on stdout). Access lines are enabled in production (`LOG_ACCESS=true` in `cutline-config`).
- **Phase 2** — Semantic domain and auth events (below): one pino line per meaningful action.

## Log pipeline (infra — #176)

Pod stdout is collected by **Grafana Alloy** (DaemonSet) and stored in **Loki** (14d retention on `rook-ceph-block`). Grafana (`https://grafana.i.psilva.org`) has a **Loki** datasource, the **Cutline / Logs** dashboard, and Grafana-managed alert rules.

**This repo does not own the collector/store** — manifests live in Forgejo [`argoCD-apps`](https://forgejo.i.psilva.org/gabepsilva/argoCD-apps) (`loki/`, `alloy/`, `kube-prometheus-stack/manifests/cutline-*`). See that repo's `DEPLOYMENT_ORDER.md` steps 8–9 and `scripts/deploy-cutline-log-pipeline.sh`.

### Deploy order (tk8s)

1. Merge + push **argoCD-apps** `main` (Loki, Alloy, Grafana datasource/dashboards).
2. Register Applications (from argoCD-apps repo root):

   ```sh
   kubectl apply -k kube-prometheus-stack/argocd/
   kubectl apply -k loki/argocd/
   kubectl apply -k alloy/argocd/
   ```

   Or: `./scripts/deploy-cutline-log-pipeline.sh`

3. Merge this repo (enables `LOG_ACCESS=true`); Argo syncs `cutline-prod`.
4. Verify: `./scripts/observability/verify-log-pipeline.sh`

### Querying logs

| Goal | LogQL (Grafana → Explore → Loki) |
| ---- | -------------------------------- |
| All cutline logs | `{namespace="cutline"} \| json` |
| One HTTP request | `{namespace="cutline",container="cutline"} \| json \| requestId="<uuid>"` |
| Trace async work | `{namespace="cutline"} \| json \| causationId="<requestId>"` |
| Unhandled errors | `{namespace="cutline"} \| json \| msg="unhandled server error"` |
| Job failures | `{namespace="cutline",container="worker"} \| json \| msg=~"job failed; no retries left\|ingest job dead-lettered"` |
| Access / 5xx | `{namespace="cutline",container="cutline"} \| json \| msg="request" \| status >= 500` |

`requestId` is returned on 500 responses (`x-request-id` header on all responses) and stamped on job payloads as `causationId` for worker events.

### Alerts (Grafana UI v1)

Firing rules appear in **Grafana → Alerting** (no Slack/email yet — Alertmanager receiver stays `null`):

- Unhandled server error rate (5m)
- Job dead-letter / no-retries-left (any occurrence)
- Web 5xx ratio > 5% sustained (5m)

## Event shape

Every semantic event is a single pino `info` line:

```json
{
	"event": "media.ingested",
	"actorId": "user-uuid",
	"target": { "type": "media", "id": "media-uuid" },
	"causationId": "request-uuid",
	"msg": "event"
}
```

Fields:

| Field         | Meaning                                            |
| ------------- | -------------------------------------------------- |
| `event`       | Stable event name (dot-separated)                  |
| `actorId`     | User who performed the action (when known)         |
| `target`      | `{ type, id }` of the primary entity affected      |
| `causationId` | Originating `requestId` for request-triggered work |
| `...data`     | Event-specific extras (e.g. `jobId`, `wordCount`)  |

Use the `event()` helper in `$lib/server/log` so field names stay uniform.

## v1 event taxonomy

| Event                    | Emitted at                                    | actor            | target     | Extra fields                                           |
| ------------------------ | --------------------------------------------- | ---------------- | ---------- | ------------------------------------------------------ |
| `auth.signup`            | better-auth user create hook                  | user id          | user id    | —                                                      |
| `auth.login.success`     | better-auth session create hook               | user id          | user id    | `method` (`password` \| `github`)                      |
| `auth.login.failure`     | better-auth sign-in hook (failed email login) | —                | —          | `method`, `email` (attempted email only)               |
| `project.created`        | upload-url API (new project + first media)    | user id          | project id | —                                                      |
| `project.deleted`        | dashboard delete action                       | user id          | project id | —                                                      |
| `media.upload.completed` | complete upload API                           | user id          | media id   | `jobId`, `causationId`                                 |
| `job.canceled`           | cancel job API                                | user id          | job id     | —                                                      |
| `media.ingested`         | ingest job handler (media → ready)            | from job payload | media id   | `causationId`                                          |
| `transcript.produced`    | transcription job handler                     | from job payload | project id | `causationId`, `provider`, `wordCount`, `speakerCount` |

## Causation threading

`causationId` is the HTTP `requestId` from the request that started the work. It is stamped onto job payloads at enqueue time (`completeMediaUpload`) and read back in async handlers so worker-emitted events tie to the originating API call.

Flow: upload complete API → ingest job payload → `media.ingested` event; for A-roll, transcription job payload → `transcript.produced` event — all sharing the same `causationId`.

## Out of scope (separate issues)

- Durable audit store (retention, query API)
- External alert channels (Slack/email/PagerDuty) — Grafana UI is the v1 inbox
- App `/metrics` + PodMonitor (sibling issue)
- Export job events (#143)

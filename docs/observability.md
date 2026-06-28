# Observability

Cutline observability is delivered in two phases:

- **Phase 1** — Structured pino access and job logs (`requestId`, job lifecycle lines on stdout). Access lines are **off by default** (`LOG_ACCESS=true` to enable) until the log pipeline (#176) ships.
- **Phase 2** — Semantic domain and auth events (this document): one pino line per meaningful action.

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
- Infra log pipeline (#176)
- Export job events (#143)

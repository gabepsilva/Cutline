# STT provider decision (M9-00)

**Status:** decided — **AssemblyAI**  
**Consumers:** M9-01 transcription worker (#141), editor transcript load (#130)

## Rationale

Cutline requires **word-level timestamps** and **speaker diarization** for the transcript editor, EDL geometry, and multi-speaker UI.

| Option               | Verdict                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **AssemblyAI**       | **Chosen.** Async API with per-word timings and `speaker_labels`; no GPU infra to run or scale.                                     |
| Self-hosted WhisperX | Rejected — GPU ops, patching, and diarization plumbing add infra we do not want on the critical path.                               |
| Deepgram             | Comparable capability; not chosen to keep a single external provider. Revisit only if cost, latency, or accuracy proves inadequate. |

The app calls AssemblyAI from the **internal transcription worker** (#141), never the browser. Credentials live in 1Password (`ASSEMBLYAI_API_KEY`).

## Integration shape

1. Worker claims a `transcription` job (#137).
2. Mint a short-lived **presigned R2 GET** for the source or transcode key (#138/#139).
3. `POST` AssemblyAI with `audio_url` + `speaker_labels: true` (+ punctuate/format).
4. Poll until `completed` or `error`; fetch `words` and sentence segmentation.
5. Assemble `Word[]` + speakers; write to `transcript` table; mark job `succeeded`.

Long media: AssemblyAI handles duration asynchronously; the worker heartbeats the #137 lease so the job is not reaped mid-transcription.

## Cost model

- Async transcription is billed **per hour of audio processed** (per-second rate × media duration).
- Diarization (`speaker_labels`) is included in the model price — not a separate per-minute SKU.
- Cost scales with **uploaded media minutes**, not edits. A natural lever for plan tiers alongside storage quota (#134).
- **Confirm the live per-hour rate at [assemblyai.com/pricing](https://www.assemblyai.com/pricing) before finalizing product pricing** — rates change; do not hardcode a dollar amount into plan math.

## Output mapping → `$lib/types/transcript`

| AssemblyAI field                    | App field                  | Transform                                                                                             |
| ----------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `words[].text`                      | `Word.text`                | raw token                                                                                             |
| (derived)                           | `Word.clean`               | lowercase, strip non-`[a-z']`                                                                         |
| `words[].start` (ms)                | `Word.start` (s)           | `/1000` — source A-roll anchor per [EDL](edl.md)                                                      |
| `words[].end` − `start` (ms)        | `Word.dur` (s)             | `/1000`                                                                                               |
| (derived)                           | `Word.filler`              | `clean ∈ {um, uh, …}`                                                                                 |
| `words[].speaker` (`"A"`, `"B"`, …) | `Word.speaker` (**new**)   | label string                                                                                          |
| sentence segmentation               | `Word.sid` + `Sentence`    | group words into sentences                                                                            |
| —                                   | `Word.bars`                | **not from STT** — sampled from ingest waveform (#139) over `[start, end]` during assembly, else `[]` |
| speaker label set                   | `transcript.speakers` JSON | `label → { name, initials }`; default `"Speaker A"` / `"A"`; user-renamable                           |

### Model extensions (owned by M9-01)

- Add **`Word.speaker?: string`** to `$lib/types/transcript`.
- Add **`transcript.speakers`** JSON column (migration): label → `{ name, initials }`. Replaces the single-speaker `TranscriptSpeakerData` shape; editor speaker UI becomes multi-speaker.

## Hard requirements — satisfied

- Per-word `start` / `end` → `Word.start` / `Word.dur` in source seconds.
- Speaker diarization → `Word.speaker` + `transcript.speakers`.

# Edit Decision List (EDL)

The EDL is the canonical mapping between **source A-roll media time** and the **edited timeline** after word-level cuts. It is derived at runtime from persisted `Word[]` — never stored in the database.

## Source of truth

- **Persist:** `transcript.words` JSON (`Word[]` including `deleted`), overlay rows, `caption_style`.
- **Derive:** `buildEdl(words)` in `$lib/editor/edl.ts`.
- **Do not** add an `edl` column; rebuild on load and after every edit.

## `Word.start`

Each word has an inclusive `start` in **source media seconds** (half-open interval `[start, start + dur)`).

- Mock / sequential builders set `start` cumulatively.
- STT ingest (M9) populates from ASR word timestamps.
- Legacy rows missing `start` fall back to cumulative derivation at load via `deriveWordStarts()`.

## Deleted words → kept spans

Walk `Word[]` in document order. Group **maximal runs of consecutive non-deleted words**.

For each run, one kept span in source time:

```
sourceStart = first.start
sourceEnd   = last.start + last.dur   // exclusive
```

Natural silence between two kept words in the same run stays in the span. A deleted word breaks the run — everything from the previous span's `sourceEnd` to the next span's `sourceStart` is **cut**.

## Edited timeline vs export

| Timeline                                               | Duration rule                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| **Edited** (UI playhead, timeline, captions, overlays) | `sum(active.dur) + nActive * WORD_GAP` (`WORD_GAP = 0.02`)           |
| **Export output** (A-roll concat)                      | `sum(keptSpan.sourceEnd - keptSpan.sourceStart)` — **no** `WORD_GAP` |

Per active word:

```
editedStart = prior editedEnd + WORD_GAP   // first word: 0
editedEnd   = editedStart + dur            // gap follows the word, not inside it
```

## Inter-word silence on edited timeline

During the `WORD_GAP` after a word (`[editedEnd, editedEnd + WORD_GAP)`):

- **Preview (future video sync):** hold source at the previous word's `sourceEnd` (freeze frame / last audio sample).
- **Export:** gap does not exist — kept spans concat directly.

## Audio / video continuity

- **v1:** hard cuts at kept-span boundaries (no crossfade).
- **Preview:** seek `<video>` to the next span's `sourceStart` when crossing a cut.
- **ffmpeg export (M10):** one trimmed segment per kept span, then concat.

## B-roll overlapping a cut

Overlays are **edited-timeline anchored** (`Overlay.start`, `Overlay.dur`). An overlay may cover edited time where underlying A-roll was cut — the overlay still plays for its full edited duration. EDL geometry covers **A-roll only**; overlays are a separate layer on edited seconds.

## Caption timing

Captions follow the **edited timeline** via `segments`. Deleted words produce no caption tokens. `captionStyle` is editor metadata — not part of EDL geometry. Export burn-in (M10) uses each active word's `[editedStart, editedEnd)`.

## API

```
Word[]  ──buildEdl()──►  EditDecisionList
                              ├── keptSpans[]     → ffmpeg trim/concat (M10)
                              ├── segments[]      → preview seek, captions, timeline UI
                              └── editedDuration  → transport, ruler, overlays
```

| Function                      | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `buildEdl(words)`             | Full EDL                                                   |
| `buildKeptSpans(words)`       | Source spans only                                          |
| `editedToSource(edl, t)`      | Preview `<video>` seek target; `null` before/after content |
| `sourceToEdited(edl, t)`      | Map source scrub back to playhead; `null` in cut regions   |
| `editedWordAt(edl, words, t)` | Word under playhead                                        |

Types live in `$lib/types/edl.ts`.

## Consumers

| Consumer                        | Uses                                               |
| ------------------------------- | -------------------------------------------------- |
| Preview video sync (M8+)        | `buildEdl`, `editedToSource`                       |
| Timeline / captions / transport | `segments`, `editedDuration` (via `editor-derive`) |
| ffmpeg export (M10)             | `keptSpans`                                        |
| Persist (#131)                  | stores `Word[]`; EDL rebuilt on load               |

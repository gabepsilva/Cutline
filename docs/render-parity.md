# Render approach & preview/export parity (M10-00)

**Status:** decided  
**Consumers:** M10-01 export worker (#143), preview video sync (M8+), `PreviewCaptions.svelte`, future `ass-captions.ts`

Render is a pure function of **persisted edit state** (`Word[]`, overlays, `captionStyle`) via `buildEdl()` — never of preview DOM. See [EDL](edl.md) for geometry definitions.

---

## 1. Render pipeline (ffmpeg over the EDL)

Stages run in order on the worker (#143):

### 1.1 A-roll cut + concat

From `edl.keptSpans` (source-time ranges):

- One trimmed segment per span: `-ss sourceStart -to sourceEnd`.
- Concatenate with `filter_complex` `concat` and re-encode for frame accuracy.
- **Hard cuts — no `WORD_GAP`.** Export concatenates kept spans directly; the 0.02 s preview gap is intentional and documented below.
- Output duration = `Σ(sourceEnd − sourceStart)`.

### 1.2 B-roll composite

Overlays are **edited-timeline** anchored (`Overlay.start`, `Overlay.dur`).

- Scale and position each overlay clip in **relative frame coordinates** (fractions of frame width/height).
- Composite with `overlay=…:enable='between(t,start,start+dur)'`.
- A-roll underneath may be discontinuous at cuts; the overlay plays for its full edited duration per [EDL § B-roll](edl.md#b-roll-overlapping-a-cut).

### 1.3 Caption burn-in (when `burnCaptions`)

- Events from `edl.segments`: each active word `[editedStart, editedEnd)`.
- Karaoke highlight = current word on the **output** timeline (equivalent to `currentWordId` in preview).
- Render via **ASS/libass** generated from segments — not `drawtext` — for styling and per-word highlight fidelity.
- Generator: `src/lib/editor/ass-captions.ts` (#143).

### 1.4 Encode

To `ExportConfig` format and resolution (section 3).

---

## 2. Preview/export parity

**Principle: one geometry source, one layout spec, two renderers.** Divergence is only allowed where defined and harmless.

| Concern                     | Parity mechanism                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cut boundaries / timing** | Preview (`editedToSource`) and export (`keptSpans`) both derive from **`buildEdl()`** (#136). Identical by construction. Target: cut frames within **±1 frame**.                       |
| **Captions**                | Single **caption layout spec** (below). `PreviewCaptions.svelte` CSS and the ASS generator both derive from it. Resolution-independent (% of frame height).                            |
| **Overlay position/scale**  | Geometry in **relative frame coordinates** (fractions). Applied identically in preview CSS and ffmpeg `scale`/`overlay`.                                                               |
| **`WORD_GAP` freeze**       | Preview holds the last frame during the 0.02 s edited gap ([EDL](edl.md#inter-word-silence-on-edited-timeline)); export has no gap. **Documented, intentional** — not a parity defect. |
| **Color/scaling**           | Pin ffmpeg scaling flags, pixel format, and color range so transcode does not shift tone vs `<video>`.                                                                                 |

### Caption layout spec (shared by preview + export)

Canonical values are **fractions of frame dimensions** so any output height scales correctly. Preview today uses a 16∶9 player; map fixed px to fractions using the preview player height as reference (`fontSizePx / playerHeight`, etc.).

| Token               | Value                                                    | Notes                                     |
| ------------------- | -------------------------------------------------------- | ----------------------------------------- |
| `horizontalPadding` | `0.072` × frame width                                    | preview: `26px` on ~360px-wide panel      |
| `maxTextWidth`      | `0.88` × frame width                                     | centered block                            |
| `fontSize`          | `0.035` × frame height                                   | preview: `19px` on ~540px-tall 16∶9 frame |
| `fontWeight`        | `600`                                                    |                                           |
| `fontFamily`        | `Helvetica Neue, Helvetica, Arial, sans-serif`           | match `--font-sans`                       |
| `lineHeight`        | `1.4`                                                    |                                           |
| `letterSpacing`     | `-0.01em`                                                |                                           |
| `textAlign`         | `center`                                                 |                                           |
| `textShadow`        | `0 2px 14px rgb(0 0 0 / 85%)`                            | ASS: equivalent outline/shadow            |
| `colorDefault`      | `#f6f5f2`                                                | `--text-bright`; clean style              |
| `colorDimmed`       | `rgb(255 255 255 / 55%)`                                 | karaoke non-current words                 |
| `colorHighlight`    | `#ff6a3d`                                                | `--accent`; karaoke current word          |
| `verticalPosition`  | bottom-centered, `0.08` × frame height above bottom edge | captions sit in lower third               |

**Styles:**

- `karaoke` — current word `colorHighlight`, others `colorDimmed`.
- `clean` — all words `colorDefault`.

### Overlay geometry

Store and apply overlay placement as **relative frame coordinates**:

- `x`, `y` — top-left corner as fraction of frame width/height (0–1).
- `scale` — width as fraction of frame width (height preserves aspect).
- Timeline `start` / `dur` remain **edited seconds**; only spatial layout uses frame fractions.

Preview CSS and ffmpeg `scale` + `overlay` filters consume the same tuple.

---

## 3. Output formats & resolutions

Honors existing `ExportConfig` (`mp4` \| `mov` \| `gif` × `720p` \| `1080p` \| `4k` + `burnCaptions`). No UI change required.

| Format | Codec                          | Notes                                              |
| ------ | ------------------------------ | -------------------------------------------------- |
| `mp4`  | H.264 High + AAC, `+faststart` | default; web-friendly                              |
| `mov`  | H.264 in MOV + AAC             | ProRes noted as future editing-handoff option      |
| `gif`  | `palettegen` / `paletteuse`    | **no audio**; fps capped ~15; **clamped to ≤720p** |

**Resolution = cap, never upscale.** If source height is below the chosen cap, render at source height and report honestly. Example: 4k request on 1080p source → 1080p output.

| Request | Target height |
| ------- | ------------- |
| `720p`  | 720           |
| `1080p` | 1080          |
| `4k`    | 2160          |

`scale` to target height preserving aspect ratio.

---

## 4. Golden-frame parity test (#143 must ship)

Regression guard — parity is a test, not a hope.

### Fixture

Short project with:

- At least one deleted word (cut boundary).
- One B-roll overlay spanning a cut.
- `burnCaptions: true`, `karaoke` style.

### Procedure

1. Render fixture to MP4 at 1080p via the export worker.
2. Sample **N = 8** frames at known **edited-timeline** timestamps (including one inside `WORD_GAP` — expect preview/export divergence there by design).
3. Capture preview screenshots at the same edited timestamps (headless browser, 16∶9 player).
4. Compare with SSIM or per-channel MAE.

### Tolerance

- **Geometry samples** (non-gap): MAE ≤ **8** per RGB channel after resize to common dimensions, or SSIM ≥ **0.92**.
- **Caption samples**: bounding box of caption text within **2%** of frame width/height vs spec; highlight word matches `colorHighlight` within tolerance.
- **Gap samples**: excluded from pass/fail — documented intentional divergence.

### CI

- Run ffmpeg-in-CI against the fixture in `src/lib/test/fixtures/`.
- Fail the build if any non-gap sample exceeds tolerance.

---

## API summary

```
Word[] + overlays + captionStyle
        │
        ▼
   buildEdl()  ──► keptSpans  ──► ffmpeg trim/concat
        │          segments   ──► ASS burn-in
        │          editedDuration
        ▼
   caption layout spec ──► PreviewCaptions CSS
                        └─► ass-captions.ts
```

Types: `$lib/types/edl.ts`, `$lib/components/editor/modals/ExportModal.types.ts`.

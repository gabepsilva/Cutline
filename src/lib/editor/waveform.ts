import { buildEdl, editedToSource } from '$lib/editor/edl';
import type { FilmstripMeta, WaveformData } from '$lib/types/ingest-assets';
import type { WaveBar } from '$lib/types/timeline';
import type { Word } from '$lib/types/transcript';

const DEFAULT_BAR_COUNT = 180;

function peakAtSourceTime(waveform: WaveformData, sourceTime: number): number {
	const index = Math.floor(sourceTime * waveform.peaksPerSecond);
	if (index < 0 || index >= waveform.data.length) return 0;
	return waveform.data[index] ?? 0;
}

/** Map source-time waveform peaks onto the edited timeline via the EDL (M8-02). */
export function waveformBarsFromEdl(
	words: Word[],
	waveform: WaveformData,
	barCount = DEFAULT_BAR_COUNT
): WaveBar[] {
	const edl = buildEdl(words);
	const total = edl.editedDuration;
	const bars: WaveBar[] = [];

	for (let index = 0; index < barCount; index++) {
		const editedTime = (index / barCount) * total;
		const sourceTime = editedToSource(edl, editedTime);
		const height = sourceTime == null ? 0 : peakAtSourceTime(waveform, sourceTime);
		bars.push({
			leftPct: (editedTime / total) * 100,
			widthPct: Math.max(0.25, (100 / barCount) * 0.62),
			heightPct: 8 + height * 78
		});
	}

	return bars;
}

export interface FilmstripFrame {
	leftPct: number;
	widthPct: number;
	frameIndex: number;
}

/** Positions for V1 filmstrip frames mapped through the EDL. */
export function filmstripFramesFromEdl(
	words: Word[],
	meta: FilmstripMeta,
	frameCount = 48
): FilmstripFrame[] {
	const edl = buildEdl(words);
	const total = edl.editedDuration;
	const frames: FilmstripFrame[] = [];

	for (let index = 0; index < frameCount; index++) {
		const editedTime = (index / frameCount) * total;
		const sourceTime = editedToSource(edl, editedTime);
		if (sourceTime == null) continue;

		const frameIndex = Math.min(
			meta.frameCount - 1,
			Math.max(0, Math.floor(sourceTime / meta.intervalSec))
		);

		frames.push({
			leftPct: (editedTime / total) * 100,
			widthPct: Math.max(0.8, 100 / frameCount),
			frameIndex
		});
	}

	return frames;
}

/** Sprite background position for a frame index in a tiled JPG. */
export function filmstripBackgroundPosition(
	meta: FilmstripMeta,
	frameIndex: number
): { xPct: number; yPct: number } {
	const col = frameIndex % meta.cols;
	const row = Math.floor(frameIndex / meta.cols);
	const xPct = meta.cols <= 1 ? 0 : (col / (meta.cols - 1)) * 100;
	const yPct = meta.rows <= 1 ? 0 : (row / (meta.rows - 1)) * 100;
	return { xPct, yPct };
}

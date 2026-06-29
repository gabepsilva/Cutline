import type { CaptionStyle, Word } from '$lib/types/transcript';
import type { Clip, Tick, WaveBar } from '$lib/types/timeline';
import { formatTimecode } from '$lib/utils/format-timecode';
import { buildEdl, editedToSource, editedWordAt, WORD_GAP } from './edl';

export { WORD_GAP };

export function activeWords(words: Word[]): Word[] {
	return words.filter((w) => !w.deleted);
}

/** Total edited duration in seconds — ignores soft-deleted words. */
export function totalDuration(words: Word[]): number {
	return buildEdl(words).editedDuration;
}

/** Map edited playhead time to source media time for preview video sync. */
export function sourceTimeAt(words: Word[], editedTime: number): number | null {
	return editedToSource(buildEdl(words), editedTime);
}

/** Map each active word id to its start time on the edited timeline. */
export function buildStartMap(active: Word[]): Record<string, number> {
	const edl = buildEdl(active);
	const startMap: Record<string, number> = {};
	for (const segment of edl.segments) {
		startMap[segment.wordId] = segment.editedStart;
	}
	return startMap;
}

export function clampTime(time: number, duration: number): number {
	const safe = Number.isFinite(time) ? time : 0;
	return Math.min(Math.max(0, safe), duration);
}

/** Map a timeline lane click to a seek time — mirrors design `onTimelineClick`. */
export function seekTimeFromTimelineClick(event: MouseEvent, duration: number): number {
	const target = event.currentTarget;
	if (!target || typeof (target as Element).getBoundingClientRect !== 'function') return 0;
	const rect = (target as Element).getBoundingClientRect();
	if (rect.width <= 0) return 0;
	const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
	return clampTime(ratio * duration, duration);
}

/** Word under the playhead, or first/last active word at the edges. */
export function currentWordId(
	active: Word[],
	startMap: Record<string, number>,
	currentTime: number
): string | null {
	void startMap;
	return editedWordAt(buildEdl(active), active, currentTime);
}

/** A1 waveform bars positioned along the edited timeline. */
export function waveformBars(
	active: Word[],
	startMap: Record<string, number>,
	total: number
): WaveBar[] {
	const bars: WaveBar[] = [];
	for (const w of active) {
		const start = startMap[w.id];
		const barCount = w.bars.length;
		const slot = w.dur / total;
		w.bars.forEach((height, index) => {
			const leftPct = ((start + w.dur * (index / barCount)) / total) * 100;
			const widthPct = Math.max(0.25, (slot / barCount) * 100 * 0.62);
			bars.push({ leftPct, widthPct, heightPct: 8 + height * 78 });
		});
	}
	return bars;
}

/** V1/CC clip blocks — one per sentence with active words. */
export function trackClips(words: Word[], startMap: Record<string, number>, total: number): Clip[] {
	const bySid = new Map<string, Word[]>();
	const sidOrder: string[] = [];
	for (const w of words) {
		if (!bySid.has(w.sid)) {
			bySid.set(w.sid, []);
			sidOrder.push(w.sid);
		}
		bySid.get(w.sid)!.push(w);
	}

	const clips: Clip[] = [];
	for (const sid of sidOrder) {
		const sentenceWords = bySid.get(sid)!.filter((w) => !w.deleted);
		if (sentenceWords.length === 0) continue;

		const first = sentenceWords[0];
		const last = sentenceWords[sentenceWords.length - 1];
		const start = startMap[first.id];
		const end = startMap[last.id] + last.dur;
		const leftPct = (start / total) * 100;
		// Design clamps the raw clip width to a 1.2% floor, then trims 0.5% for the
		// inter-clip gap (renderVals: `Math.max(1.2, …)` then `width - 0.5`).
		const widthPct = Math.max(1.2, ((end - start) / total) * 100) - 0.5;
		clips.push({
			leftPct,
			widthPct,
			label: sentenceWords
				.slice(0, 5)
				.map((w) => w.text)
				.join(' ')
		});
	}
	return clips;
}

/** Ruler tick marks spread across the edited duration. */
export function rulerTicks(total: number, count = 8): Tick[] {
	const ticks: Tick[] = [];
	const step = total / count;
	for (let i = 0; i <= count; i++) {
		const time = i * step;
		ticks.push({ leftPct: (time / total) * 100, label: formatTimecode(time) });
	}
	return ticks;
}

export interface CaptionToken {
	id: string;
	display: string;
	isCurrent: boolean;
}

/** Caption tokens for the current sentence — styling is class-driven in the view. */
export function captionWords(
	sentenceWords: Word[],
	currentId: string | null,
	style: CaptionStyle
): CaptionToken[] {
	void style;
	return sentenceWords
		.filter((w) => !w.deleted)
		.map((w) => ({
			id: w.id,
			display: `${w.text} `,
			isCurrent: w.id === currentId
		}));
}

/** Caption tokens for the sentence under the playhead. */
export function captionWordsForCurrentSentence(
	words: Word[],
	currentId: string | null,
	style: CaptionStyle
): CaptionToken[] {
	if (!currentId) return [];
	const current = words.find((word) => word.id === currentId);
	if (!current) return [];
	const sentenceWords = words.filter((word) => word.sid === current.sid);
	return captionWords(sentenceWords, currentId, style);
}

/** Subtitle under clip length — mirrors design `savedLabel`. */
export function trimmedLabel(deletedCount: number): string {
	return deletedCount > 0 ? `−${deletedCount} words trimmed` : 'Original cut';
}

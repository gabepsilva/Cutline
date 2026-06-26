import type { EditDecisionList, EditedWordSegment, KeptSpan } from '$lib/types/edl';
import type { Word } from '$lib/types/transcript';

/** Gap between active words on the edited timeline (design `0.02`). */
export const WORD_GAP = 0.02;

/** Cumulative source `start` when a word row omits it (legacy / load-time fallback). */
export function deriveWordStarts(words: Word[]): Word[] {
	let time = 0;
	return words.map((word) => {
		const hasStart = Number.isFinite(word.start);
		const start = hasStart ? word.start : time;
		time = start + word.dur + WORD_GAP;
		return hasStart ? word : { ...word, start };
	});
}

/** Maximal runs of consecutive non-deleted words in source time. */
export function buildKeptSpans(words: Word[]): KeptSpan[] {
	const spans: KeptSpan[] = [];
	let runStart: number | null = null;
	let runEnd: number | null = null;

	for (const word of words) {
		if (word.deleted) {
			if (runStart !== null && runEnd !== null) {
				spans.push({ sourceStart: runStart, sourceEnd: runEnd });
				runStart = null;
				runEnd = null;
			}
			continue;
		}

		const sourceEnd = word.start + word.dur;
		if (runStart === null) {
			runStart = word.start;
			runEnd = sourceEnd;
		} else {
			runEnd = sourceEnd;
		}
	}

	if (runStart !== null && runEnd !== null) {
		spans.push({ sourceStart: runStart, sourceEnd: runEnd });
	}

	return spans;
}

function buildSegments(active: Word[]): EditedWordSegment[] {
	const segments: EditedWordSegment[] = [];
	let editedCursor = 0;

	for (const word of active) {
		const editedStart = editedCursor;
		const editedEnd = editedStart + word.dur;
		segments.push({
			wordId: word.id,
			sourceStart: word.start,
			sourceEnd: word.start + word.dur,
			editedStart,
			editedEnd
		});
		editedCursor = editedEnd + WORD_GAP;
	}

	return segments;
}

/** Full edit decision list derived from transcript words. */
export function buildEdl(words: Word[]): EditDecisionList {
	const withStarts = deriveWordStarts(words);
	const active = withStarts.filter((word) => !word.deleted);
	const segments = buildSegments(active);
	const keptSpans = buildKeptSpans(withStarts);

	const editedDuration =
		segments.length === 0
			? 0.001
			: segments.reduce((sum, segment) => sum + segment.editedEnd - segment.editedStart, 0) +
				segments.length * WORD_GAP;

	return {
		keptSpans,
		segments,
		editedDuration,
		wordGap: WORD_GAP
	};
}

function segmentAtEditedTime(
	edl: EditDecisionList,
	editedTime: number
): { segment: EditedWordSegment; phase: 'word' | 'gap' } | null {
	for (const segment of edl.segments) {
		if (editedTime >= segment.editedStart && editedTime < segment.editedEnd) {
			return { segment, phase: 'word' };
		}
		if (editedTime >= segment.editedEnd && editedTime < segment.editedEnd + edl.wordGap) {
			return { segment, phase: 'gap' };
		}
	}
	return null;
}

/** Map edited playhead time to source media time; `null` before/after content or in cuts. */
export function editedToSource(edl: EditDecisionList, editedTime: number): number | null {
	if (edl.segments.length === 0) return null;

	const hit = segmentAtEditedTime(edl, editedTime);
	if (hit) {
		if (hit.phase === 'gap') return hit.segment.sourceEnd;
		return hit.segment.sourceStart + (editedTime - hit.segment.editedStart);
	}

	const first = edl.segments[0]!;
	const last = edl.segments.at(-1)!;
	if (editedTime < first.editedStart) return null;
	if (editedTime >= last.editedEnd + edl.wordGap) return null;
	return null;
}

function segmentAtSourceTime(edl: EditDecisionList, sourceTime: number): EditedWordSegment | null {
	for (const segment of edl.segments) {
		if (sourceTime >= segment.sourceStart && sourceTime < segment.sourceEnd) {
			return segment;
		}
	}
	return null;
}

/** Map source media scrub time back to edited playhead; `null` inside cut regions. */
export function sourceToEdited(edl: EditDecisionList, sourceTime: number): number | null {
	const segment = segmentAtSourceTime(edl, sourceTime);
	if (!segment) return null;
	return segment.editedStart + (sourceTime - segment.sourceStart);
}

/** Active word under the edited playhead (includes WORD_GAP tail per word). */
export function editedWordAt(
	edl: EditDecisionList,
	words: Word[],
	editedTime: number
): string | null {
	const active = words.filter((word) => !word.deleted);
	if (active.length === 0) return null;

	const hit = segmentAtEditedTime(edl, editedTime);
	if (hit) return hit.segment.wordId;

	if (editedTime <= 0) return active[0]!.id;
	return active.at(-1)!.id;
}

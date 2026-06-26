import { describe, expect, it } from 'vitest';
import {
	buildEdl,
	buildKeptSpans,
	deriveWordStarts,
	editedToSource,
	editedWordAt,
	sourceToEdited,
	WORD_GAP
} from './edl';
import type { Word } from '$lib/types/transcript';

function word(overrides: Partial<Word> & Pick<Word, 'id' | 'start' | 'dur' | 'deleted'>): Word {
	return {
		text: overrides.id,
		clean: overrides.id,
		bars: [],
		filler: false,
		sid: 's0',
		...overrides
	};
}

describe('edl', () => {
	describe('buildKeptSpans', () => {
		it('splits around a deleted word', () => {
			const words = [
				word({ id: 'w0', start: 0, dur: 0.4, deleted: false }),
				word({ id: 'w1', start: 0.45, dur: 0.15, deleted: true }),
				word({ id: 'w2', start: 0.65, dur: 0.25, deleted: false })
			];
			expect(buildKeptSpans(words)).toEqual([
				{ sourceStart: 0, sourceEnd: 0.4 },
				{ sourceStart: 0.65, sourceEnd: 0.9 }
			]);
		});

		it('returns empty spans when every word is deleted', () => {
			const words = [word({ id: 'w0', start: 0, dur: 0.4, deleted: true })];
			expect(buildKeptSpans(words)).toEqual([]);
		});
	});

	describe('buildEdl', () => {
		it('computes edited duration with gaps between active words', () => {
			const words = [
				word({ id: 'w0', start: 0, dur: 0.3, deleted: false }),
				word({ id: 'w1', start: 0.35, dur: 0.2, deleted: false }),
				word({ id: 'w2', start: 0.6, dur: 0.4, deleted: false })
			];
			const edl = buildEdl(words);
			expect(edl.editedDuration).toBeCloseTo(0.9 + 3 * WORD_GAP, 5);
			expect(edl.segments).toHaveLength(3);
			expect(edl.segments[0]).toMatchObject({ editedStart: 0, editedEnd: 0.3 });
		});

		it('skips adjacent deleted words into one cut', () => {
			const words = [
				word({ id: 'w0', start: 0, dur: 0.3, deleted: false }),
				word({ id: 'w1', start: 0.35, dur: 0.1, deleted: true }),
				word({ id: 'w2', start: 0.5, dur: 0.1, deleted: true }),
				word({ id: 'w3', start: 0.65, dur: 0.2, deleted: false })
			];
			const spans = buildEdl(words).keptSpans;
			expect(spans).toHaveLength(2);
			expect(spans[0]).toEqual({ sourceStart: 0, sourceEnd: 0.3 });
			expect(spans[1]?.sourceStart).toBe(0.65);
			expect(spans[1]?.sourceEnd).toBeCloseTo(0.85, 5);
		});

		it('handles leading and trailing deletes', () => {
			const words = [
				word({ id: 'w0', start: 0, dur: 0.2, deleted: true }),
				word({ id: 'w1', start: 0.25, dur: 0.3, deleted: false }),
				word({ id: 'w2', start: 0.6, dur: 0.2, deleted: true })
			];
			expect(buildEdl(words).keptSpans).toEqual([{ sourceStart: 0.25, sourceEnd: 0.55 }]);
		});
	});

	describe('editedToSource', () => {
		const words = [
			word({ id: 'w0', start: 0, dur: 0.4, deleted: false }),
			word({ id: 'w1', start: 0.45, dur: 0.15, deleted: true }),
			word({ id: 'w2', start: 0.65, dur: 0.25, deleted: false })
		];
		const edl = buildEdl(words);

		it('maps mid-word edited time linearly', () => {
			expect(editedToSource(edl, 0.1)).toBeCloseTo(0.1, 5);
		});

		it('holds at source end during WORD_GAP', () => {
			const w0 = edl.segments[0]!;
			const gapTime = w0.editedEnd + WORD_GAP / 2;
			expect(editedToSource(edl, gapTime)).toBeCloseTo(w0.sourceEnd, 5);
		});

		it('returns null inside source cut regions', () => {
			expect(editedToSource(edl, -0.01)).toBeNull();
		});
	});

	describe('sourceToEdited', () => {
		const words = [
			word({ id: 'w0', start: 0, dur: 0.4, deleted: false }),
			word({ id: 'w1', start: 0.45, dur: 0.15, deleted: true }),
			word({ id: 'w2', start: 0.65, dur: 0.25, deleted: false })
		];
		const edl = buildEdl(words);

		it('maps source time inside a kept span', () => {
			expect(sourceToEdited(edl, 0.1)).toBeCloseTo(0.1, 5);
			expect(sourceToEdited(edl, 0.75)).toBeCloseTo(edl.segments[1]!.editedStart + 0.1, 5);
		});

		it('returns null inside cut regions', () => {
			expect(sourceToEdited(edl, 0.5)).toBeNull();
		});
	});

	describe('editedWordAt', () => {
		const words = [
			word({ id: 'w0', start: 0, dur: 0.4, deleted: false }),
			word({ id: 'w1', start: 0.45, dur: 0.15, deleted: true }),
			word({ id: 'w2', start: 0.65, dur: 0.25, deleted: false })
		];
		const edl = buildEdl(words);

		it('returns the word under the playhead including gap tail', () => {
			const w0 = edl.segments[0]!;
			expect(editedWordAt(edl, words, w0.editedStart + 0.05)).toBe('w0');
			expect(editedWordAt(edl, words, w0.editedEnd + WORD_GAP / 2)).toBe('w0');
		});
	});

	describe('deriveWordStarts', () => {
		it('fills missing start values cumulatively', () => {
			const words = [
				{
					...word({ id: 'w0', start: 0, dur: 0.3, deleted: false }),
					start: undefined as unknown as number
				},
				{
					...word({ id: 'w1', start: 0, dur: 0.2, deleted: false }),
					start: undefined as unknown as number
				}
			];
			const derived = deriveWordStarts(words);
			expect(derived[0]?.start).toBe(0);
			expect(derived[1]?.start).toBeCloseTo(0.32, 5);
		});
	});
});

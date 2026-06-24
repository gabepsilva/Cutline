import { describe, expect, it } from 'vitest';
import {
	activeWords,
	buildStartMap,
	captionWords,
	clampTime,
	currentWordId,
	rulerTicks,
	totalDuration,
	trackClips,
	waveformBars,
	WORD_GAP
} from './editor-derive';
import { fixtureTranscriptWords } from '$lib/test/fixtures';
import type { Word } from '$lib/types/transcript';

describe('editor-derive', () => {
	describe('totalDuration', () => {
		it('sums active word durations plus gaps', () => {
			const words = fixtureTranscriptWords;
			const expected = words.reduce((sum, w) => sum + w.dur + WORD_GAP, 0);
			expect(totalDuration(words)).toBeCloseTo(expected, 5);
		});

		it('ignores deleted words', () => {
			const words = fixtureTranscriptWords.map((w) =>
				w.id === 'w2' ? { ...w, deleted: true } : w
			);
			const active = activeWords(words);
			const expected = active.reduce((sum, w) => sum + w.dur + WORD_GAP, 0);
			expect(totalDuration(words)).toBeCloseTo(expected, 5);
		});

		it('returns at least 0.001 for an empty transcript', () => {
			expect(totalDuration([])).toBe(0.001);
		});
	});

	describe('buildStartMap', () => {
		it('assigns cumulative start times', () => {
			const active = activeWords(fixtureTranscriptWords);
			const map = buildStartMap(active);
			expect(map.w0).toBe(0);
			expect(map.w1).toBeCloseTo(active[0].dur + WORD_GAP, 5);
			expect(map.w3).toBeCloseTo(
				active[0].dur + WORD_GAP + active[1].dur + WORD_GAP + active[2].dur + WORD_GAP,
				5
			);
		});
	});

	describe('clampTime', () => {
		it.each([
			{ input: -5, duration: 10, expected: 0 },
			{ input: 30, duration: 10, expected: 10 },
			{ input: 4.5, duration: 10, expected: 4.5 }
		])('clamps $input within [0, $duration]', ({ input, duration, expected }) => {
			expect(clampTime(input, duration)).toBe(expected);
		});

		it('treats non-finite input as zero', () => {
			expect(clampTime(NaN, 10)).toBe(0);
		});
	});

	describe('currentWordId', () => {
		it('returns the word under the playhead', () => {
			const active = activeWords(fixtureTranscriptWords);
			const map = buildStartMap(active);
			expect(currentWordId(active, map, map.w1! + 0.01)).toBe('w1');
		});

		it('returns the first word at time zero', () => {
			const active = activeWords(fixtureTranscriptWords);
			const map = buildStartMap(active);
			expect(currentWordId(active, map, 0)).toBe('w0');
		});

		it('returns null when no active words exist', () => {
			expect(currentWordId([], {}, 0)).toBeNull();
		});
	});

	describe('waveformBars', () => {
		it('emits one bar per word bar sample', () => {
			const active = activeWords(fixtureTranscriptWords);
			const total = totalDuration(fixtureTranscriptWords);
			const map = buildStartMap(active);
			const bars = waveformBars(active, map, total);
			const expectedCount = active.reduce((sum, w) => sum + w.bars.length, 0);
			expect(bars).toHaveLength(expectedCount);
		});

		it('places bars within 0–100 percent', () => {
			const active = activeWords(fixtureTranscriptWords);
			const total = totalDuration(fixtureTranscriptWords);
			const map = buildStartMap(active);
			for (const bar of waveformBars(active, map, total)) {
				expect(bar.leftPct).toBeGreaterThanOrEqual(0);
				expect(bar.leftPct).toBeLessThanOrEqual(100);
				expect(bar.widthPct).toBeGreaterThan(0);
			}
		});
	});

	describe('trackClips', () => {
		it('builds one clip per sentence with active words', () => {
			const total = totalDuration(fixtureTranscriptWords);
			const map = buildStartMap(activeWords(fixtureTranscriptWords));
			const clips = trackClips(fixtureTranscriptWords, map, total);
			expect(clips).toHaveLength(1);
			expect(clips[0]?.label).toContain('Okay');
		});

		it('floors narrow clip width at 1.2% before trimming 0.5% (design math)', () => {
			// A tiny clip relative to total: raw width is well under the 1.2% floor,
			// so the design formula clamps to 1.2 then subtracts 0.5 → 0.7.
			const narrow: Word = {
				id: 'n0',
				text: 'hi',
				clean: 'hi',
				dur: 0.05,
				bars: [0.5],
				filler: false,
				deleted: false,
				sid: 'sn'
			};
			const total = 100;
			const map = buildStartMap([narrow]);
			const clips = trackClips([narrow], map, total);
			expect(clips).toHaveLength(1);
			expect(clips[0]?.widthPct).toBeCloseTo(0.7, 5);
		});
	});

	describe('rulerTicks', () => {
		it('returns count + 1 ticks spanning the duration', () => {
			const ticks = rulerTicks(8, 8);
			expect(ticks).toHaveLength(9);
			expect(ticks[0]?.leftPct).toBe(0);
			expect(ticks.at(-1)?.leftPct).toBe(100);
		});
	});

	describe('captionWords', () => {
		it('marks the current word for karaoke styling', () => {
			const tokens = captionWords(fixtureTranscriptWords, 'w1', 'karaoke');
			expect(tokens.find((t) => t.display.startsWith('so,'))?.isCurrent).toBe(true);
			expect(tokens.find((t) => t.display.startsWith('Okay'))?.isCurrent).toBe(false);
		});

		it('omits deleted words', () => {
			const words = fixtureTranscriptWords.map((w) =>
				w.id === 'w2' ? { ...w, deleted: true } : w
			);
			const tokens = captionWords(words, null, 'clean');
			expect(tokens.some((t) => t.display.includes('um'))).toBe(false);
		});
	});
});

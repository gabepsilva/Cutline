import { describe, expect, it } from 'vitest';
import { buildSpeakers, mapAssemblyAiWords } from '$lib/server/stt/assemblyai-map';

describe('mapAssemblyAiWords', () => {
	it('maps AssemblyAI timings to Cutline words with sentence ids', () => {
		const words = mapAssemblyAiWords([
			{ text: 'Okay', start: 0, end: 420, confidence: 0.99 },
			{ text: 'so,', start: 440, end: 790, confidence: 0.98 },
			{ text: 'um,', start: 810, end: 1_090, confidence: 0.97 },
			{ text: 'done.', start: 1_110, end: 1_430, confidence: 0.96 }
		]);

		expect(words).toHaveLength(4);
		expect(words[0]).toMatchObject({ text: 'Okay', start: 0, dur: 0.42, sid: 's0', filler: false });
		expect(words[2].filler).toBe(true);
		expect(words[3].sid).toBe('s0');
		expect(words[0].speaker).toBeUndefined();
	});

	it('carries diarization labels through to words', () => {
		const words = mapAssemblyAiWords([
			{ text: 'Hi', start: 0, end: 200, confidence: 0.99, speaker: 'A' },
			{ text: 'there', start: 220, end: 480, confidence: 0.98, speaker: 'B' }
		]);

		expect(words[0].speaker).toBe('A');
		expect(words[1].speaker).toBe('B');
	});
});

describe('buildSpeakers', () => {
	it('assembles a deduped roster in first-appearance order', () => {
		const speakers = buildSpeakers([
			{ text: 'Hi', start: 0, end: 200, confidence: 1, speaker: 'A' },
			{ text: 'yo', start: 210, end: 400, confidence: 1, speaker: 'B' },
			{ text: 'again', start: 410, end: 700, confidence: 1, speaker: 'A' }
		]);

		expect(speakers).toEqual([
			{ speaker: 'A', name: 'Speaker A', initials: 'A' },
			{ speaker: 'B', name: 'Speaker B', initials: 'B' }
		]);
	});

	it('returns an empty roster when diarization is absent', () => {
		expect(buildSpeakers([{ text: 'Hi', start: 0, end: 200, confidence: 1 }])).toEqual([]);
	});
});

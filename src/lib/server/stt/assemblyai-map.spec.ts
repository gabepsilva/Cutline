import { describe, expect, it } from 'vitest';
import { mapAssemblyAiWords } from '$lib/server/stt/assemblyai-map';

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
	});
});

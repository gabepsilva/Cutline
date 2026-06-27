import { describe, expect, it } from 'vitest';
import { cleanToken, isSingleFiller, markYouKnowFillers } from '$lib/server/stt/filler';

describe('stt filler helpers', () => {
	it('cleans tokens like the editor mock', () => {
		expect(cleanToken('so,')).toBe('so');
		expect(cleanToken('um,')).toBe('um');
	});

	it('flags um and uh fillers', () => {
		expect(isSingleFiller('um')).toBe(true);
		expect(isSingleFiller('uh')).toBe(true);
		expect(isSingleFiller('so')).toBe(false);
	});

	it('marks you-know pairs as fillers', () => {
		const words = [
			{ clean: 'you', filler: false },
			{ clean: 'know', filler: false },
			{ clean: 'what', filler: false }
		];
		markYouKnowFillers(words);
		expect(words[0].filler).toBe(true);
		expect(words[1].filler).toBe(true);
		expect(words[2].filler).toBe(false);
	});
});

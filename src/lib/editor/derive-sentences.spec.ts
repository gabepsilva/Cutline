import { describe, expect, it } from 'vitest';
import type { Word } from '$lib/types/transcript';
import { deriveSentences } from './derive-sentences';

function word(id: string, sid: string, dur = 0.3): Word {
	return {
		id,
		text: id,
		clean: id,
		dur,
		bars: [0.5],
		filler: false,
		deleted: false,
		sid
	};
}

describe('deriveSentences', () => {
	it('returns an empty array for no words', () => {
		expect(deriveSentences([])).toEqual([]);
	});

	it('groups consecutive words with the same sid into one sentence', () => {
		const words = [word('w0', 's0', 0.4), word('w1', 's0', 0.2)];
		const sentences = deriveSentences(words);

		expect(sentences).toHaveLength(1);
		expect(sentences[0]).toMatchObject({
			id: 's0',
			words
		});
		expect(sentences[0].t0).toBeCloseTo(0.4 + 0.02 + 0.2 + 0.02);
	});

	it('splits sentences when sid changes in document order', () => {
		const words = [word('w0', 's0', 0.4), word('w1', 's1', 0.25), word('w2', 's1', 0.15)];
		const sentences = deriveSentences(words);

		expect(sentences).toHaveLength(2);
		expect(sentences[0]).toMatchObject({ id: 's0', words: [words[0]] });
		expect(sentences[1]).toMatchObject({ id: 's1', words: [words[1], words[2]] });
	});

	it('starts a new sentence when the same sid appears again after a break', () => {
		const words = [word('w0', 's0'), word('w1', 's1'), word('w2', 's0')];
		const sentences = deriveSentences(words);

		expect(sentences).toHaveLength(3);
		expect(sentences.map((sentence) => sentence.id)).toEqual(['s0', 's1', 's0']);
	});
});

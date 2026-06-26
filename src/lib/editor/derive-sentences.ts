import type { Sentence, Word } from '$lib/types/transcript';

/** Gap between words when accumulating sentence timing (mirrors mock `0.02`). */
const WORD_GAP = 0.02;

/** Gap between sentences in cumulative timing (mirrors mock `0.2`). */
const SENTENCE_GAP = 0.2;

/** Group consecutive words by `sid` and derive UI-only `t0` metadata. */
export function deriveSentences(words: Word[]): Sentence[] {
	if (words.length === 0) return [];

	const sentences: Sentence[] = [];
	let currentSid: string | null = null;
	let currentWords: Word[] = [];
	let time = 0;

	const flush = () => {
		if (currentWords.length === 0 || currentSid === null) return;
		sentences.push({ id: currentSid, words: currentWords, t0: time });
		currentWords = [];
		time += SENTENCE_GAP;
	};

	for (const word of words) {
		if (currentSid !== null && word.sid !== currentSid) {
			flush();
		}
		currentSid = word.sid;
		currentWords.push(word);
		time += word.dur + WORD_GAP;
	}

	flush();
	return sentences;
}

import { cleanToken, isSingleFiller, markYouKnowFillers } from '$lib/server/stt/filler';
import type { AssemblyAiWord } from '$lib/server/stt/assemblyai-types';
import type { Word } from '$lib/types/transcript';

function endsSentence(text: string): boolean {
	return /[.?!]["']?$/.test(text.trim());
}

function assignSentenceIds(words: Word[]): void {
	let sentenceIndex = 0;
	let currentSid = `s${sentenceIndex}`;

	for (const word of words) {
		word.sid = currentSid;
		if (endsSentence(word.text)) {
			sentenceIndex += 1;
			currentSid = `s${sentenceIndex}`;
		}
	}
}

/** Maps AssemblyAI word timings to Cutline `Word[]` (bars filled later from ingest). */
export function mapAssemblyAiWords(raw: AssemblyAiWord[]): Word[] {
	const words: Word[] = raw.map((item, index) => {
		const clean = cleanToken(item.text);
		return {
			id: `w${index}`,
			text: item.text,
			clean,
			start: item.start / 1_000,
			dur: Math.max(0, (item.end - item.start) / 1_000),
			bars: [],
			filler: isSingleFiller(clean),
			deleted: false,
			sid: 's0'
		};
	});

	markYouKnowFillers(words);
	assignSentenceIds(words);
	return words;
}

import { cleanToken, isSingleFiller, markYouKnowFillers } from '$lib/server/stt/filler';
import type { AssemblyAiWord } from '$lib/server/stt/assemblyai-types';
import type { TranscriptSpeaker, Word } from '$lib/types/transcript';

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
			sid: 's0',
			...(item.speaker ? { speaker: item.speaker } : {})
		};
	});

	markYouKnowFillers(words);
	assignSentenceIds(words);
	return words;
}

/**
 * Assembles the diarized speaker roster from AssemblyAI words, in first-appearance
 * order. Each label becomes `Speaker <label>` with the label as initials.
 */
export function buildSpeakers(raw: AssemblyAiWord[]): TranscriptSpeaker[] {
	const seen = new Set<string>();
	const speakers: TranscriptSpeaker[] = [];

	for (const item of raw) {
		const label = item.speaker;
		if (!label || seen.has(label)) continue;
		seen.add(label);
		speakers.push({ speaker: label, name: `Speaker ${label}`, initials: label });
	}

	return speakers;
}

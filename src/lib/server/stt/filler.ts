const SINGLE_FILLERS = new Set(['um', 'uh']);

/** Lowercase token with non-letters stripped — matches editor mock normalization. */
export function cleanToken(text: string): string {
	return text.replace(/[^a-zA-Z']/g, '').toLowerCase();
}

export function isSingleFiller(clean: string): boolean {
	return SINGLE_FILLERS.has(clean);
}

/** Marks adjacent "you know" pairs as fillers (in-place). */
export function markYouKnowFillers(words: { clean: string; filler: boolean }[]): void {
	for (let index = 0; index < words.length - 1; index++) {
		if (words[index].clean === 'you' && words[index + 1].clean === 'know') {
			words[index].filler = true;
			words[index + 1].filler = true;
		}
	}
}

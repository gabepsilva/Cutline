import type { Sentence, Word } from '$lib/types/transcript';

export interface TranscriptSentenceProps {
	sentence: Sentence;
	/** Timeline start (seconds) of the first active word — used for the timecode label. */
	startTime?: number;
	currentWordId?: string | null;
	selectedWordId?: string | null;
	searchQuery?: string;
	showFiller?: boolean;
	onTimeClick?: (event: MouseEvent) => void;
	onWordClick?: (word: Word, event: MouseEvent) => void;
	class?: string;
}

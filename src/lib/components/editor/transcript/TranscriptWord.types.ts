import type { Word } from '$lib/types/transcript';

export interface TranscriptWordProps {
	word: Word;
	current?: boolean;
	selected?: boolean;
	searchMatch?: boolean;
	showFiller?: boolean;
	onclick?: (word: Word, event: MouseEvent) => void;
	class?: string;
}

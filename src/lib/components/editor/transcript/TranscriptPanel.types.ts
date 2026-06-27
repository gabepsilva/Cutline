import type { Sentence, Word } from '$lib/types/transcript';
import type { TranscriptUiStatus } from '$lib/types/transcript-ui';
import type { TranscriptSpeakerData } from './TranscriptSpeaker.types';

export interface TranscriptPanelProps {
	sentences: Sentence[];
	/** Fallback header shown for sentences without a diarized speaker label. */
	speaker: TranscriptSpeakerData;
	/** Diarized speakers keyed by STT label (e.g. "A"); empty for single-speaker (M9-01). */
	speakersByLabel?: Record<string, TranscriptSpeakerData>;
	status?: TranscriptUiStatus;
	transcriptionProgress?: number;
	transcriptionStage?: string;
	searchQuery?: string;
	fillerCount?: number;
	hasSelection?: boolean;
	selectedText?: string;
	deleteLabel?: string;
	currentWordId?: string | null;
	selectedWordId?: string | null;
	showFiller?: boolean;
	/** Precomputed sentence start times (seconds); derived from words when omitted. */
	sentenceStartTimes?: Record<string, number>;
	onsearch?: (event: Event & { currentTarget: HTMLInputElement }) => void;
	onremovefillers?: (event: MouseEvent) => void;
	ondelete?: (event: MouseEvent) => void;
	onsentenceclick?: (sentence: Sentence, event: MouseEvent) => void;
	onwordclick?: (word: Word, event: MouseEvent) => void;
	class?: string;
}

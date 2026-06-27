/** Transcript domain types (M5-00). */
export interface Word {
	id: string;
	text: string;
	clean: string;
	/** Inclusive start in source A-roll media (seconds from t=0). */
	start: number;
	dur: number;
	bars: number[];
	filler: boolean;
	deleted: boolean;
	sid: string;
	/** Diarization label from STT (e.g. "A"); absent for single-speaker transcripts (M9-01). */
	speaker?: string;
}

/** Diarized speaker entry, keyed by its STT label (e.g. "A" → "Speaker A") (M9-01). */
export interface TranscriptSpeaker {
	/** STT diarization label, e.g. "A". */
	speaker: string;
	name: string;
	initials: string;
}

export interface Sentence {
	id: string;
	words: Word[];
	t0: number;
}

export type CaptionStyle = 'karaoke' | 'clean';

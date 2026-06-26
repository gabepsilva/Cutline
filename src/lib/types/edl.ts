/** One contiguous source-media A-roll range after word-level cuts. */
export interface KeptSpan {
	sourceStart: number; // inclusive, seconds
	sourceEnd: number; // exclusive, seconds
}

/** One active word mapped to both timelines. */
export interface EditedWordSegment {
	wordId: string;
	sourceStart: number;
	sourceEnd: number; // exclusive
	editedStart: number;
	editedEnd: number; // exclusive (= editedStart + dur)
}

export interface EditDecisionList {
	keptSpans: KeptSpan[];
	segments: EditedWordSegment[]; // active words, document order
	editedDuration: number;
	wordGap: number; // always WORD_GAP (0.02)
}

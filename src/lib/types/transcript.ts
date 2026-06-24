/** Transcript domain types (M5-00). */
export interface Word {
	id: string;
	text: string;
	clean: string;
	dur: number;
	bars: number[];
	filler: boolean;
	deleted: boolean;
	sid: string;
}

export interface Sentence {
	id: string;
	words: Word[];
	t0: number;
}

export type CaptionStyle = 'karaoke' | 'clean';

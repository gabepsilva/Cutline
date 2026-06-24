/** Timeline overlay dropped from the media shelf (M6-00). */
export interface Overlay {
	id: string;
	resId: string;
	name: string;
	start: number;
	dur: number;
	thumb: string;
}

/** Ruler tick mark. */
export interface Tick {
	leftPct: number;
	label: string;
}

/** V1 / CC track block. */
export interface Clip {
	leftPct: number;
	widthPct: number;
	label: string;
}

/** A1 waveform bar. */
export interface WaveBar {
	leftPct: number;
	widthPct: number;
	heightPct: number;
}

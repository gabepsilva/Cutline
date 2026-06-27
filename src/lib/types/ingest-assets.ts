/** Normalized audio peaks written by the ingest worker (M8-02). */
export interface WaveformData {
	version: number;
	peaksPerSecond: number;
	length: number;
	data: number[];
}

/** Filmstrip sprite metadata alongside `filmstrip.jpg` (M8-02). */
export interface FilmstripMeta {
	frameCount: number;
	intervalSec: number;
	frameW: number;
	frameH: number;
	cols: number;
	rows: number;
}

export const WAVEFORM_PEAKS_PER_SECOND = 50;

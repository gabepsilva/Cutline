import { describe, expect, it } from 'vitest';
import { buildEdl } from '$lib/editor/edl';
import { filmstripFramesFromEdl, waveformBarsFromEdl } from '$lib/editor/waveform';
import type { FilmstripMeta, WaveformData } from '$lib/types/ingest-assets';
import type { Word } from '$lib/types/transcript';

const words: Word[] = [
	{
		id: 'w1',
		text: 'one',
		clean: 'one',
		start: 0,
		dur: 1,
		bars: [],
		filler: false,
		deleted: false,
		sid: 's1'
	},
	{
		id: 'w2',
		text: 'two',
		clean: 'two',
		start: 1,
		dur: 1,
		bars: [],
		filler: false,
		deleted: true,
		sid: 's1'
	},
	{
		id: 'w3',
		text: 'three',
		clean: 'three',
		start: 2,
		dur: 1,
		bars: [],
		filler: false,
		deleted: false,
		sid: 's1'
	}
];

const waveform: WaveformData = {
	version: 1,
	peaksPerSecond: 10,
	length: 40,
	data: Array.from({ length: 40 }, (_, index) => (index % 10) / 10)
};

const filmstripMeta: FilmstripMeta = {
	frameCount: 4,
	intervalSec: 1,
	frameW: 80,
	frameH: 45,
	cols: 2,
	rows: 2
};

describe('waveform EDL mapping', () => {
	it('samples source peaks through editedToSource and skips cut regions', () => {
		const bars = waveformBarsFromEdl(words, waveform, 20);
		const edl = buildEdl(words);
		expect(bars.length).toBe(20);
		expect(edl.editedDuration).toBeLessThan(3);
		expect(bars.some((bar) => bar.heightPct <= 8)).toBe(true);
		expect(bars.some((bar) => bar.heightPct > 8)).toBe(true);
	});
});

describe('filmstrip EDL mapping', () => {
	it('chooses sprite frames from source time and omits cut gaps', () => {
		const frames = filmstripFramesFromEdl(words, filmstripMeta, 12);
		expect(frames.length).toBeGreaterThan(0);
		expect(frames.every((frame) => frame.frameIndex >= 0 && frame.frameIndex < 4)).toBe(true);
	});
});

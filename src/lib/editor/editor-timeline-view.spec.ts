import { describe, expect, it } from 'vitest';
import {
	activeWords,
	buildStartMap,
	rulerTicks,
	trackClips,
	totalDuration,
	waveformBars
} from './editor-derive';
import { toTimelineBars, toTimelineClips, toTimelineTicks } from './editor-timeline-view';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';

describe('editor-timeline-view', () => {
	const active = activeWords(fixtureTranscriptWords);
	const startMap = buildStartMap(active);
	const total = totalDuration(fixtureTranscriptWords);

	it('converts ruler ticks to Timeline tick props', () => {
		const ticks = toTimelineTicks(rulerTicks(total));
		expect(ticks[0]).toMatchObject({ id: 'tick-0', left: '0.000%', label: '0:00' });
		expect(ticks.at(-1)?.label).toBeTruthy();
	});

	it('converts waveform bars to Timeline bar props', () => {
		const bars = toTimelineBars(waveformBars(active, startMap, total));
		expect(bars.length).toBeGreaterThan(0);
		expect(bars[0]).toMatchObject({
			id: 'bar-0',
			left: expect.stringMatching(/%$/),
			width: expect.stringMatching(/%$/),
			height: expect.stringMatching(/%$/)
		});
	});

	it('converts track clips to Timeline clip placeholders', () => {
		const clips = toTimelineClips(trackClips(fixtureTranscriptWords, startMap, total));
		expect(clips[0]).toMatchObject({
			id: 'clip-0',
			left: expect.stringMatching(/%$/),
			width: expect.stringMatching(/%$/),
			label: expect.any(String)
		});
	});
});

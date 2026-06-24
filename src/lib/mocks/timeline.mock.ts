// MOCK: Timeline preview data for shell routes until EditorState / transcript wiring (M5-00).
// TODO(backend): Replace with EditorState derivations in project editor load (M5-12).
import type {
	TimelineBar,
	TimelineClipPlaceholder,
	TimelineTick
} from '$lib/components/editor/timeline/Timeline.types';

const TOTAL_SECONDS = 272;

function pct(value: number): string {
	return `${value.toFixed(3)}%`;
}

/** Ruler ticks matching the design prototype (8 steps across total duration). */
export const mockTimelineTicks: TimelineTick[] = Array.from({ length: 9 }, (_, index) => {
	const time = (TOTAL_SECONDS / 8) * index;
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return {
		id: `tick-${index}`,
		left: pct((time / TOTAL_SECONDS) * 100),
		label: `${minutes}:${seconds.toString().padStart(2, '0')}`
	};
});

/** Static waveform bars for the A1 track shell preview. */
export const mockTimelineBars: TimelineBar[] = Array.from({ length: 48 }, (_, index) => {
	const height = 8 + (((index * 17) % 79) / 100) * 78;
	const left = (index / 48) * 100;
	const width = Math.max(0.25, (100 / 48) * 0.62);
	return {
		id: `bar-${index}`,
		left: pct(left),
		width: pct(width),
		height: `${height.toFixed(1)}%`
	};
});

/** Placeholder clips for V1 and CC track rows. */
export const mockTimelineClips: TimelineClipPlaceholder[] = [
	{ id: 'clip-1', left: '2.500%', width: '18.000%', label: 'Welcome to Cutline' },
	{ id: 'clip-2', left: '24.000%', width: '22.500%', label: 'today we are going to' },
	{ id: 'clip-3', left: '52.000%', width: '20.000%', label: 'walk through the editor' },
	{ id: 'clip-4', left: '76.000%', width: '16.500%', label: 'and export workflow' }
];

export const mockTimelinePlayheadPercent = 23.897;
export const mockTimelineResourceCount = 3;
export const mockTimelineDurationSeconds = TOTAL_SECONDS;

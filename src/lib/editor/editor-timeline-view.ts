import type {
	TimelineBar,
	TimelineClipPlaceholder,
	TimelineTick
} from '$lib/components/editor/timeline/Timeline.types';
import type { Clip, Tick, WaveBar } from '$lib/types/timeline';
import { formatPercent } from '$lib/types/timeline';

/** Map domain ruler ticks to `Timeline` component props. */
export function toTimelineTicks(ticks: Tick[]): TimelineTick[] {
	return ticks.map((tick, index) => ({
		id: `tick-${index}`,
		left: formatPercent(tick.leftPct),
		label: tick.label
	}));
}

/** Map domain waveform bars to `Timeline` component props. */
export function toTimelineBars(bars: WaveBar[]): TimelineBar[] {
	return bars.map((bar, index) => ({
		id: `bar-${index}`,
		left: formatPercent(bar.leftPct),
		width: formatPercent(bar.widthPct),
		height: `${bar.heightPct.toFixed(1)}%`
	}));
}

/** Map domain track clips to `Timeline` component props. */
export function toTimelineClips(clips: Clip[]): TimelineClipPlaceholder[] {
	return clips.map((clip, index) => ({
		id: `clip-${index}`,
		left: formatPercent(clip.leftPct),
		width: formatPercent(clip.widthPct),
		label: clip.label
	}));
}

import type { MediaResource } from '$lib/types/media';

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

/** Convert a percentage number to a CSS percent string. */
export function formatPercent(pct: number, decimals = 3): string {
	const safe = Number.isFinite(pct) ? pct : 0;
	return `${safe.toFixed(decimals)}%`;
}

/** Parse a CSS percent string back to a number (invalid → 0). */
export function parsePercent(value: string): number {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

/** Map a domain clip to CSS positioning values for timeline templates. */
export function clipCssPercent(
	clip: Clip,
	decimals = 3
): {
	left: string;
	width: string;
} {
	return {
		left: formatPercent(clip.leftPct, decimals),
		width: formatPercent(clip.widthPct, decimals)
	};
}

/** B-roll overlay layout — mirrors design `renderVals()` (lines 851–852). */
export function overlayPercents(
	overlay: Overlay,
	totalDuration: number
): {
	leftPct: number;
	widthPct: number;
} {
	const total = Math.max(0.001, totalDuration);
	const leftPct = Math.max(0, (overlay.start / total) * 100);
	const widthPct = Math.max(1.5, (overlay.dur / total) * 100);
	return { leftPct, widthPct };
}

/** Stable overlay id when dropping a resource at the playhead. */
export function overlayId(resourceId: string, index: number): string {
	return `o-${resourceId}-${index}`;
}

/** Create an overlay when adding media to the B-roll track. */
export function createOverlay(resource: MediaResource, startTime: number, index: number): Overlay {
	return {
		id: overlayId(resource.id, index),
		resId: resource.id,
		name: resource.name,
		start: Math.max(0, startTime),
		dur: resource.dur,
		thumb: resource.thumb
	};
}

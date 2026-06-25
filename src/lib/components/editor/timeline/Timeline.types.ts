import type { EditorState } from '$lib/editor/editor-state.svelte';

export interface TimelineTick {
	id: string;
	left: string;
	label: string;
}

export interface TimelineBar {
	id: string;
	left: string;
	width: string;
	height: string;
}

export interface TimelineClipPlaceholder {
	id: string;
	left: string;
	width: string;
	label?: string;
}

export type TimelineTrackLabelVariant = 'broll' | 'default';

export interface TimelineTrackLabel {
	id: string;
	label: string;
	variant?: TimelineTrackLabelVariant;
}

interface TimelineBase {
	class?: string;
	snapEnabled?: boolean;
	trackLabels?: TimelineTrackLabel[];
}

export type TimelineProps = TimelineBase &
	(
		| {
				editor: EditorState;
				ticks?: never;
				bars?: never;
				clips?: never;
				playheadPercent?: never;
				resourceCount?: never;
				brollEmpty?: never;
				onrecord?: never;
				onmedia?: never;
				onsnapchange?: never;
				onseek?: never;
		  }
		| {
				editor?: undefined;
				ticks: TimelineTick[];
				bars: TimelineBar[];
				clips: TimelineClipPlaceholder[];
				playheadPercent: number;
				resourceCount?: number;
				brollEmpty?: boolean;
				onrecord?: () => void;
				onmedia?: () => void;
				onsnapchange?: (enabled: boolean) => void;
				onseek?: (event: MouseEvent) => void;
		  }
	);

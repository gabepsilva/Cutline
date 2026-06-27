import type { EditorState } from '$lib/editor/editor-state.svelte';
import type { IngestAssetsState } from '$lib/editor/ingest-assets';
import type { Overlay } from '$lib/types/timeline';

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
	ingestAssets?: IngestAssetsState | null;
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
				overlays?: never;
				totalDuration?: never;
				onoverlayclick?: never;
				onoverlayremove?: never;
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
				overlays?: Overlay[];
				totalDuration?: number;
				onoverlayclick?: (overlay: Overlay) => void;
				onoverlayremove?: (id: string) => void;
				onrecord?: () => void;
				onmedia?: () => void;
				onsnapchange?: (enabled: boolean) => void;
				onseek?: (event: MouseEvent) => void;
		  }
	);

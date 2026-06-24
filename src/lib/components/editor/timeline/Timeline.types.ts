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

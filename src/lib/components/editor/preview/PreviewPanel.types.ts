import type { CaptionToken } from '$lib/editor/editor-derive';
import type { CaptionStyle } from '$lib/types/transcript';

export interface PreviewPanelProps {
	playing: boolean;
	currentTime: number;
	totalLabel: string;
	savedLabel: string;
	deletedCount: number;
	wordCount: number;
	captionTokens?: CaptionToken[];
	captionStyle?: CaptionStyle;
	showCaptions?: boolean;
	recLabel?: string;
	videoUrl?: string | null;
	showSimulated?: boolean;
	ontogglePlay?: () => void;
	oncaptionstylechange?: (style: CaptionStyle) => void;
	class?: string;
}

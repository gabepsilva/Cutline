import type { CaptionToken } from '$lib/editor/editor-derive';
import type { CaptionStyle } from '$lib/types/transcript';

export interface PreviewPanelProps {
	playing: boolean;
	currentTime: number;
	sourceTime?: number | null;
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
	/** Map `<video>` source clock back to edited playhead time (#214). */
	onsourceclock?: (sourceTime: number) => void;
	onvideoclockdrive?: (active: boolean) => void;
	onplaybackended?: () => void;
	class?: string;
}

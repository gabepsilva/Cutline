import type { CaptionToken } from '$lib/editor/editor-derive';
import type { CaptionStyle } from '$lib/types/transcript';

export interface PreviewCaptionsProps {
	tokens?: CaptionToken[];
	style?: CaptionStyle;
	visible?: boolean;
	class?: string;
}

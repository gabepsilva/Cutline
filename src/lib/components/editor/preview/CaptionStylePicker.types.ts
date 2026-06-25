import type { CaptionStyle } from '$lib/types/transcript';

export interface CaptionStylePickerProps {
	value?: CaptionStyle;
	onchange?: (style: CaptionStyle) => void;
	class?: string;
}

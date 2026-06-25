import type { Clip } from '$lib/types/timeline';

export type TimelineClipVariant = 'video' | 'caption';

export interface TimelineClipProps {
	id: string;
	clip: Clip;
	variant?: TimelineClipVariant;
	class?: string;
}

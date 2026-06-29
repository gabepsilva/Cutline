import type { Snippet } from 'svelte';

export interface PreviewPlayerProps {
	playing: boolean;
	currentTime: number;
	/** Source media time (seconds) mapped from the edited playhead — drives `<video>` sync. */
	sourceTime?: number | null;
	recLabel?: string;
	videoUrl?: string | null;
	showSimulated?: boolean;
	captions?: Snippet;
	ontogglePlay?: () => void;
	class?: string;
}

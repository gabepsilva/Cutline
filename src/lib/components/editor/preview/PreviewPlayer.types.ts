import type { Snippet } from 'svelte';

export interface PreviewPlayerProps {
	playing: boolean;
	currentTime: number;
	recLabel?: string;
	videoUrl?: string | null;
	showSimulated?: boolean;
	captions?: Snippet;
	ontogglePlay?: () => void;
	class?: string;
}

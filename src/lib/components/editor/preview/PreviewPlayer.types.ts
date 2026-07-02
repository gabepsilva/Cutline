import type { Snippet } from 'svelte';

export interface PreviewPlayerProps {
	playing: boolean;
	currentTime: number;
	/** Source media time (seconds) mapped from the edited playhead — drives `<video>` sync. */
	sourceTime?: number | null;
	recLabel?: string;
	videoUrl?: string | null;
	showSimulated?: boolean;
	/** Fired while playing with a real video — maps source clock back to the editor (#214). */
	onsourceclock?: (sourceTime: number) => void;
	/** Toggle whether the parent should use the video element as the playback clock. */
	onvideoclockdrive?: (active: boolean) => void;
	/** Fired when the `<video>` reaches its natural end. */
	onplaybackended?: () => void;
	captions?: Snippet;
	ontogglePlay?: () => void;
	class?: string;
}

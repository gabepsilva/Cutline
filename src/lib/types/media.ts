import { formatTimecode } from '$lib/utils/format-timecode';

/** Media shelf resource shape (M6-00). */
export type MediaKind = 'B-roll' | 'Graphic' | 'Recording';

export interface MediaResource {
	id: string;
	name: string;
	dur: number;
	kind: MediaKind | (string & {});
	thumb: string;
}

export const MEDIA_KINDS = [
	'B-roll',
	'Graphic',
	'Recording'
] as const satisfies readonly MediaKind[];

/** Design `durTC` label for media shelf cards. */
export function formatMediaDuration(seconds: number): string {
	return formatTimecode(seconds);
}

export function isMediaKind(kind: string): kind is MediaKind {
	return (MEDIA_KINDS as readonly string[]).includes(kind);
}

/** Placeholder thumb for in-app recordings (design record review card). */
export function recordingThumb(): string {
	return 'repeating-linear-gradient(135deg,#2a1715 0 11px,#221210 11px 22px)';
}

/** Neutral fallback thumb shown for a captured clip before a real thumbnail exists. */
export const DEFAULT_RECORD_THUMB =
	'repeating-linear-gradient(135deg,#161619 0 14px,#121215 14px 28px)';

/** Build a recording resource after capture stops. */
export function createRecordingResource(counter: number, durationSeconds: number): MediaResource {
	const duration = Math.max(1, Math.round(durationSeconds));
	return {
		id: `rec-${counter}`,
		name: `Recording ${counter}`,
		dur: duration,
		kind: 'Recording',
		thumb: recordingThumb()
	};
}

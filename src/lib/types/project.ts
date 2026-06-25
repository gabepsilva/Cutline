import { formatTimecode } from '$lib/utils/format-timecode';

/** Dashboard project card shape (M4-00). */
export type ProjectKind = 'DEMO' | 'INTERVIEW' | 'TALKING HEAD' | 'VLOG' | 'WEBINAR';

export interface Project {
	id: string;
	title: string;
	durationLabel: string;
	kind: ProjectKind | (string & {});
	/** Hero subtitle — optional; grid cards use meta only. */
	description?: string;
	meta: string;
	thumb: string;
}

export const PROJECT_KINDS = [
	'DEMO',
	'INTERVIEW',
	'TALKING HEAD',
	'VLOG',
	'WEBINAR'
] as const satisfies readonly ProjectKind[];

/** Design `durTC` label for project cards. */
export function formatProjectDuration(seconds: number): string {
	return formatTimecode(seconds);
}

export function isProjectKind(kind: string): kind is ProjectKind {
	return (PROJECT_KINDS as readonly string[]).includes(kind);
}

const PROJECT_THUMBS: Record<ProjectKind, string> = {
	WEBINAR: 'repeating-linear-gradient(135deg,#1f1a2c 0 12px,#191622 12px 24px)',
	'TALKING HEAD': 'repeating-linear-gradient(135deg,#15211f 0 12px,#121a19 12px 24px)',
	INTERVIEW: 'repeating-linear-gradient(135deg,#241c19 0 12px,#1b1714 12px 24px)',
	DEMO: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
	VLOG: 'repeating-linear-gradient(135deg,#26201a 0 12px,#1c1814 12px 24px)'
};

const DEFAULT_PROJECT_THUMB = 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)';

/** Placeholder thumb gradient keyed by project kind (design project grid). */
export function projectThumb(kind: string): string {
	if (isProjectKind(kind)) return PROJECT_THUMBS[kind];
	return DEFAULT_PROJECT_THUMB;
}

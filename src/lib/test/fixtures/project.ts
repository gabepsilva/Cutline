import type { Project } from '$lib/types/project';

/** Fixture: continue-editing hero project (design dashboard). */
export const fixtureProject: Project = {
	id: 'proj-launch-recap',
	title: 'Product launch recap',
	durationLabel: '4:32',
	kind: 'WEBINAR',
	meta: 'Edited 2h ago · 1,142 words · MP4',
	thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)'
};

/** Fixture: grid card project (design lines 867–873). */
export const fixtureProjectCard: Project = {
	id: 'proj-q3-recap',
	title: 'Q3 launch recap',
	durationLabel: '7:18',
	kind: 'WEBINAR',
	meta: 'Edited 1d ago',
	thumb: 'repeating-linear-gradient(135deg,#1f1a2c 0 12px,#191622 12px 24px)'
};

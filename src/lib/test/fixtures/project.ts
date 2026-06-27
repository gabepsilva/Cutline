import type { Project } from '$lib/types/project';

/** Fixture: continue-editing hero project (design lines 72–88). */
export const fixtureProject: Project = {
	id: 'proj-hero',
	title: 'How I edit videos 3x faster',
	durationLabel: '4:32',
	kind: 'TALKING HEAD',
	description:
		'Talking-head tutorial · 1080p · transcript ready. Pick up where you left off — 8 sentences, 2 filler words flagged.',
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

/** Fixture: draft project card waiting on footage. */
export const fixtureDraftProjectCard: Project = {
	id: 'proj-draft',
	title: 'Untitled draft',
	durationLabel: '0:00',
	kind: 'DEMO',
	meta: 'Waiting for footage',
	isDraft: true,
	thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)'
};

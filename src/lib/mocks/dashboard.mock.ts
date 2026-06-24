// MOCK: Dashboard projects and hero data until the projects table exists.
// TODO(backend): Replace with drizzle query in +page.server.ts (M4-04).
import type { Project } from '$lib/types/project';

export { mockUser } from './user.mock';
export { mockStorageUsage } from './storage.mock';

/** Hero project — design lines 72–88. */
export const mockLatestProject: Project = {
	id: 'proj-hero',
	title: 'How I edit videos 3x faster',
	durationLabel: '4:32',
	kind: 'TALKING HEAD',
	description:
		'Talking-head tutorial · 1080p · transcript ready. Pick up where you left off — 8 sentences, 2 filler words flagged.',
	meta: 'Edited 2h ago · 1,142 words · MP4',
	thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)'
};

/** Recent project grid — design lines 90–105. */
export const mockProjects: Project[] = [
	{
		id: 'proj-q3-recap',
		title: 'Q3 launch recap',
		durationLabel: '7:18',
		kind: 'WEBINAR',
		meta: 'Edited 1d ago',
		thumb: 'repeating-linear-gradient(135deg,#1f1a2c 0 12px,#191622 12px 24px)'
	},
	{
		id: 'proj-interview',
		title: 'Founder interview',
		durationLabel: '12:04',
		kind: 'INTERVIEW',
		meta: 'Edited 3d ago',
		thumb: 'repeating-linear-gradient(135deg,#1a2220 0 12px,#161c1a 12px 24px)'
	},
	{
		id: 'proj-vlog',
		title: 'Week in the life vlog',
		durationLabel: '5:47',
		kind: 'VLOG',
		meta: 'Edited 5d ago',
		thumb: 'repeating-linear-gradient(135deg,#221a1a 0 12px,#1c1616 12px 24px)'
	},
	{
		id: 'proj-demo',
		title: 'Product demo cut',
		durationLabel: '3:21',
		kind: 'DEMO',
		meta: 'Edited 1w ago',
		thumb: 'repeating-linear-gradient(135deg,#1a1a22 0 12px,#16161c 12px 24px)'
	}
];

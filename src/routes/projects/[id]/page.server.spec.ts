import { describe, expect, it, vi } from 'vitest';
import type { EditorProjectLoad } from '$lib/types/editor-load';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/editor-project-load', () => ({
	loadEditorProject: vi.fn()
}));

import { loadEditorProject } from '$lib/server/editor-project-load';
import { load } from './+page.server';

const mockedLoadEditorProject = vi.mocked(loadEditorProject);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

const editorLoadFixture: EditorProjectLoad = {
	project: {
		id: 'proj-hero',
		title: 'How I edit videos 3x faster',
		durationLabel: '4:32',
		kind: 'TALKING HEAD',
		meta: 'Edited 2h ago',
		thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)'
	},
	meta: 'Auto-saved',
	words: [],
	captionStyle: 'karaoke',
	sentences: [],
	speaker: { name: 'Alex Chen', initials: 'AC' },
	videoUrl: null,
	resources: [],
	overlays: []
};

describe('projects/[id]/+page.server load', () => {
	it('returns editor load data from the server loader', async () => {
		mockedLoadEditorProject.mockResolvedValueOnce(editorLoadFixture);

		const data = await load({
			params: { id: 'proj-hero' },
			locals: { user: authUser }
		} as Parameters<typeof load>[0]);

		expect(data).toEqual(editorLoadFixture);
		expect(mockedLoadEditorProject).toHaveBeenCalledWith({}, authUser, 'proj-hero');
	});

	it('redirects unauthenticated visitors to login', async () => {
		try {
			await load({
				params: { id: 'proj-hero' },
				locals: {}
			} as Parameters<typeof load>[0]);
			expect.unreachable('expected redirect');
		} catch (error) {
			expect(error).toMatchObject({ status: 302, location: '/login' });
		}
	});

	it('throws 404 when the project is missing or not owned', async () => {
		mockedLoadEditorProject.mockResolvedValueOnce(null);

		await expect(
			load({
				params: { id: 'missing-project' },
				locals: { user: authUser }
			} as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});

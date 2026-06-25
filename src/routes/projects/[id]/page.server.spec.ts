import { describe, expect, it } from 'vitest';
import { loadMockEditorProject, MOCK_EMPTY_TRANSCRIPT_PROJECT_ID } from '$lib/mocks/editor.mock';
import { load } from './+page.server';

describe('projects/[id]/+page.server load', () => {
	it('returns seeded editor data for a known project id', async () => {
		const data = await load({
			params: { id: 'proj-hero' }
		} as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(data.project).toMatchObject({
			id: 'proj-hero',
			title: 'How I edit videos 3x faster'
		});
		expect(data.meta).toBe('Auto-saved · MP4 1080p');
		expect(data.words.length).toBeGreaterThan(0);
		expect(data.sentences.length).toBeGreaterThan(0);
		expect(data.speaker.name).toBe('Alex Chen');
		expect(data.resources.length).toBeGreaterThan(0);
	});

	it('returns empty transcript arrays for the no-transcript mock project', async () => {
		const data = await load({
			params: { id: MOCK_EMPTY_TRANSCRIPT_PROJECT_ID }
		} as Parameters<typeof load>[0]);

		expect(data).toBeDefined();
		if (!data) throw new Error('expected load data');

		expect(data.words).toEqual([]);
		expect(data.sentences).toEqual([]);
		expect(data.resources).toEqual([]);
	});

	it('throws 404 when the project id is unknown', async () => {
		await expect(
			load({
				params: { id: 'missing-project' }
			} as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 404 });
	});

	it('loadMockEditorProject returns null for unknown ids (empty catalog lookup)', () => {
		expect(loadMockEditorProject('does-not-exist')).toBeNull();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/editor-transcript-persist', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/editor-transcript-persist')>();
	return {
		...actual,
		parsePersistEditorTranscriptBody: vi.fn(),
		persistEditorTranscript: vi.fn()
	};
});

import {
	parsePersistEditorTranscriptBody,
	persistEditorTranscript
} from '$lib/server/editor-transcript-persist';
import { PUT } from './+server';

const mockedParse = vi.mocked(parsePersistEditorTranscriptBody);
const mockedPersist = vi.mocked(persistEditorTranscript);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

const payload = {
	words: fixtureTranscriptWords,
	captionStyle: 'karaoke' as const
};

describe('projects/[id]/+server PUT', () => {
	it('persists transcript edits for the signed-in owner', async () => {
		mockedParse.mockReturnValueOnce(payload);
		mockedPersist.mockResolvedValueOnce({ ok: true });

		const response = await PUT({
			params: { id: 'proj-1' },
			request: new Request('http://localhost/projects/proj-1', {
				method: 'PUT',
				body: JSON.stringify(payload)
			}),
			locals: { user: authUser }
		} as Parameters<typeof PUT>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(mockedPersist).toHaveBeenCalledWith({}, authUser.id, 'proj-1', payload);
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			PUT({
				params: { id: 'proj-1' },
				request: new Request('http://localhost/projects/proj-1', {
					method: 'PUT',
					body: JSON.stringify(payload)
				}),
				locals: {}
			} as Parameters<typeof PUT>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 404 when persistence rejects ownership', async () => {
		mockedParse.mockReturnValueOnce(payload);
		mockedPersist.mockResolvedValueOnce({
			ok: false,
			status: 404,
			message: 'Project not found'
		});

		await expect(
			PUT({
				params: { id: 'proj-1' },
				request: new Request('http://localhost/projects/proj-1', {
					method: 'PUT',
					body: JSON.stringify(payload)
				}),
				locals: { user: authUser }
			} as Parameters<typeof PUT>[0])
		).rejects.toMatchObject({ status: 404 });
	});
});

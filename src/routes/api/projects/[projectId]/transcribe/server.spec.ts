import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
	db: {}
}));

vi.mock('$lib/server/transcription/enqueue-transcription', () => ({
	enqueueManualTranscription: vi.fn()
}));

vi.mock('$lib/server/jobs/worker', () => ({
	kickWorker: vi.fn()
}));

vi.mock('$lib/server/log', () => ({
	event: vi.fn()
}));

import { enqueueManualTranscription } from '$lib/server/transcription/enqueue-transcription';
import { kickWorker } from '$lib/server/jobs/worker';
import { POST } from './+server';

const mockedEnqueue = vi.mocked(enqueueManualTranscription);
const mockedKick = vi.mocked(kickWorker);

const authUser = {
	id: 'user-a',
	name: 'Alex Chen',
	email: 'alex@cutline.test',
	emailVerified: true,
	createdAt: new Date('2026-06-01T00:00:00.000Z'),
	updatedAt: new Date('2026-06-01T00:00:00.000Z')
};

describe('api/projects/[projectId]/transcribe POST', () => {
	it('enqueues transcription for the signed-in owner', async () => {
		mockedEnqueue.mockResolvedValueOnce({ ok: true, jobId: 'job-1' });

		const response = await POST({
			params: { projectId: 'proj-1' },
			locals: { user: authUser, requestId: 'req-1' }
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ id: 'job-1' });
		expect(mockedEnqueue).toHaveBeenCalledWith({}, authUser.id, 'proj-1', 'req-1');
		expect(mockedKick).toHaveBeenCalledWith({});
	});

	it('returns 401 when unauthenticated', async () => {
		await expect(
			POST({
				params: { projectId: 'proj-1' },
				locals: {}
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 401 });
	});

	it('returns 400 when source media has no audio', async () => {
		mockedEnqueue.mockResolvedValueOnce({
			ok: false,
			status: 400,
			message: 'No audio in source media'
		});

		await expect(
			POST({
				params: { projectId: 'proj-1' },
				locals: { user: authUser, requestId: 'req-1' }
			} as Parameters<typeof POST>[0])
		).rejects.toMatchObject({ status: 400 });
	});
});

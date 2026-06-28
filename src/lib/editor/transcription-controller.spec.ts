import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TranscriptionController } from './transcription-controller.svelte';

vi.mock('$app/navigation', () => ({
	invalidateAll: vi.fn()
}));

vi.mock('$lib/editor/transcription-status', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/editor/transcription-status')>();
	return {
		...actual,
		pollTranscriptionJob: vi.fn()
	};
});

import { invalidateAll } from '$app/navigation';
import { pollTranscriptionJob } from '$lib/editor/transcription-status';
import type { JobStatusResponse } from '$lib/types/job';

const aRoll = { mediaId: 'm1', status: 'ready' as const, videoUrl: null, hasAudio: true };

describe('TranscriptionController', () => {
	beforeEach(() => {
		vi.mocked(pollTranscriptionJob).mockReset();
		vi.mocked(invalidateAll).mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('derives transcribing ui from job status', () => {
		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);
		controller.jobStatus = { status: 'running', progress: 0.45 };

		expect(controller.ui).toEqual({
			status: 'transcribing',
			progress: 0.45,
			stage: 'Generating transcript…'
		});
	});

	it('derives unavailable ui when a prior job failed and none is active', () => {
		const controller = new TranscriptionController(
			() => 0,
			() => aRoll,
			() => true
		);

		expect(controller.ui.status).toBe('unavailable');
	});

	it('clears job status when words already exist', () => {
		const controller = new TranscriptionController(
			() => 3,
			() => aRoll
		);
		controller.jobStatus = { status: 'running', progress: 0.45 };

		const cleanup = controller.bind('job-1');

		expect(controller.jobStatus).toBeNull();
		expect(pollTranscriptionJob).not.toHaveBeenCalled();
		cleanup();
	});

	it('polls until terminal and invalidates on success', () => {
		let onUpdate: ((status: JobStatusResponse) => void) | undefined;
		let onTerminal: ((status: JobStatusResponse) => void) | undefined;

		vi.mocked(pollTranscriptionJob).mockImplementation((_jobId, update, terminal) => {
			onUpdate = update;
			onTerminal = terminal;
			return () => undefined;
		});

		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);
		const cleanup = controller.bind('job-1');

		onUpdate?.({ status: 'running', progress: 0.4 });
		expect(controller.jobStatus).toEqual({ status: 'running', progress: 0.4 });

		onTerminal?.({ status: 'succeeded', progress: 1 });
		expect(invalidateAll).toHaveBeenCalledOnce();

		cleanup();
	});
});

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

vi.mock('$lib/editor/request-transcription', () => ({
	requestTranscription: vi.fn()
}));

import { invalidateAll } from '$app/navigation';
import { pollTranscriptionJob } from '$lib/editor/transcription-status';
import { requestTranscription } from '$lib/editor/request-transcription';
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

	it('derives idle ui when media is ready but no transcript exists', () => {
		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);

		expect(controller.ui.status).toBe('idle');
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

	it('requests transcription and starts polling the returned job id', async () => {
		vi.mocked(requestTranscription).mockResolvedValueOnce('job-new');

		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);

		await controller.request('proj-1');

		expect(requestTranscription).toHaveBeenCalledWith('proj-1');
		expect(controller.pendingJobId).toBe('job-new');
		expect(controller.jobStatus).toEqual({ status: 'queued', progress: 0 });
	});

	it('surfaces request errors as unavailable ui', async () => {
		vi.mocked(requestTranscription).mockRejectedValueOnce(
			new Error('Transcription already in progress')
		);

		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);

		await controller.request('proj-1');

		expect(controller.requestError).toBe('Transcription already in progress');
		expect(controller.ui.status).toBe('unavailable');
		expect(controller.errorMessage).toBe('Transcription already in progress');
	});

	it('keeps unavailable ui after a live terminal job failure', () => {
		let onTerminal: ((status: JobStatusResponse) => void) | undefined;

		vi.mocked(pollTranscriptionJob).mockImplementation((_jobId, _update, terminal) => {
			onTerminal = terminal;
			return () => undefined;
		});

		const controller = new TranscriptionController(
			() => 0,
			() => aRoll
		);
		const cleanup = controller.bind('job-1');

		onTerminal?.({ status: 'failed', progress: 0, error: 'AssemblyAI timeout' });
		expect(controller.pendingJobId).toBeNull();
		expect(controller.jobStatus).toEqual({
			status: 'failed',
			progress: 0,
			error: 'AssemblyAI timeout'
		});

		cleanup();
		controller.bind(null);

		expect(controller.jobStatus?.status).toBe('failed');
		expect(controller.ui.status).toBe('unavailable');
		expect(controller.errorMessage).toBe('AssemblyAI timeout');
	});
});

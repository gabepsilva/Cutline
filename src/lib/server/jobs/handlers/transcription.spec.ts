import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import type { JobRow } from '$lib/server/jobs/job-store';
import type { JobHandlerContext } from '$lib/server/jobs/worker';

function capture() {
	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });
	return { log, lines };
}

const mockR2 = vi.hoisted(() => ({
	copyObjectToPublicBucket: vi.fn().mockResolvedValue(undefined),
	deletePublicObject: vi.fn().mockResolvedValue(undefined),
	buildPublicUrl: vi
		.fn()
		.mockReturnValue('https://pub.example.r2.dev/transcription/media-1/job-1.mp4')
}));

vi.mock('$lib/server/stt/assemblyai-client', () => ({
	readAssemblyAiApiKey: vi.fn().mockReturnValue('test-key'),
	submitAssemblyAiTranscript: vi.fn().mockResolvedValue('transcript-1'),
	pollAssemblyAiTranscript: vi.fn().mockResolvedValue({
		id: 'transcript-1',
		status: 'completed',
		words: [{ text: 'hello', start: 0, end: 1000, speaker: 'A' }]
	})
}));

vi.mock('$lib/server/stt/assemblyai-map', () => ({
	mapAssemblyAiWords: vi
		.fn()
		.mockReturnValue([{ id: 'w0', text: 'hello', clean: 'hello', start: 0, end: 1, sid: 's0' }]),
	buildSpeakers: vi.fn().mockReturnValue([{ speaker: 'A', name: 'Speaker A', initials: 'A' }])
}));

vi.mock('$lib/server/storage/media-assets', () => ({
	findPrimaryMediaRow: vi.fn().mockResolvedValue({
		id: 'media-1',
		objectKey: 'users/u/projects/p/media/media-1/source.mp4',
		transcodeKey: null
	})
}));

vi.mock('$lib/server/storage/r2', () => mockR2);

vi.mock('$lib/server/transcript/write-transcript-words', () => ({
	writeTranscript: vi.fn().mockResolvedValue(5)
}));

import { runTranscriptionJob } from './transcription';

function transcriptionJob(overrides: Partial<JobRow> = {}): JobRow {
	return {
		id: 'job-1',
		type: 'transcription',
		projectId: 'proj-1',
		status: 'running',
		progress: 0,
		payload: JSON.stringify({ projectId: 'proj-1' }),
		result: null,
		error: null,
		attempts: 1,
		maxAttempts: 3,
		priority: 0,
		cancelRequested: false,
		lockedBy: 'worker-1',
		leaseUntil: new Date(Date.now() + 60_000),
		runAfter: new Date(),
		createdAt: new Date(),
		startedAt: new Date(),
		finishedAt: null,
		updatedAt: new Date(),
		...overrides
	};
}

function transcriptionContext(job: JobRow, log: pino.Logger): JobHandlerContext {
	return {
		job,
		log,
		reportProgress: vi.fn().mockResolvedValue(undefined),
		isCancelRequested: vi.fn().mockResolvedValue(false),
		complete: vi.fn().mockResolvedValue(undefined)
	};
}

describe('runTranscriptionJob', () => {
	it('completes without staging or AssemblyAI when media has no audio', async () => {
		const { findPrimaryMediaRow } = await import('$lib/server/storage/media-assets');
		vi.mocked(findPrimaryMediaRow).mockResolvedValueOnce({
			hasAudio: false
		} as never);

		const complete = vi.fn().mockResolvedValue(undefined);
		const ctx: JobHandlerContext = {
			...transcriptionContext(transcriptionJob(), pino({ level: 'silent' })),
			complete
		};

		const { submitAssemblyAiTranscript } = await import('$lib/server/stt/assemblyai-client');
		await runTranscriptionJob({} as never, ctx);

		expect(mockR2.copyObjectToPublicBucket).not.toHaveBeenCalled();
		expect(submitAssemblyAiTranscript).not.toHaveBeenCalled();
		expect(mockR2.deletePublicObject).not.toHaveBeenCalled();
		expect(complete).toHaveBeenCalledWith({ skipped: true, reason: 'no-audio' });
	});

	it('stages to public bucket and submits the public URL on success', async () => {
		const ctx = transcriptionContext(transcriptionJob(), pino({ level: 'silent' }));

		const { submitAssemblyAiTranscript } = await import('$lib/server/stt/assemblyai-client');
		await runTranscriptionJob({} as never, ctx);

		expect(mockR2.copyObjectToPublicBucket).toHaveBeenCalledWith(
			'users/u/projects/p/media/media-1/source.mp4',
			'transcription/media-1/job-1.mp4'
		);
		expect(submitAssemblyAiTranscript).toHaveBeenCalledWith(
			'https://pub.example.r2.dev/transcription/media-1/job-1.mp4',
			'test-key'
		);
		expect(submitAssemblyAiTranscript).not.toHaveBeenCalledWith(
			expect.stringContaining('r2.cloudflarestorage.com'),
			expect.anything()
		);
		expect(mockR2.deletePublicObject).toHaveBeenCalledWith('transcription/media-1/job-1.mp4');
	});

	it('deletes staged object when AssemblyAI poll throws', async () => {
		const { pollAssemblyAiTranscript } = await import('$lib/server/stt/assemblyai-client');
		vi.mocked(pollAssemblyAiTranscript).mockRejectedValueOnce(new Error('AssemblyAI failed'));

		const ctx = transcriptionContext(transcriptionJob(), pino({ level: 'silent' }));

		await expect(runTranscriptionJob({} as never, ctx)).rejects.toThrow('AssemblyAI failed');
		expect(mockR2.deletePublicObject).toHaveBeenCalledWith('transcription/media-1/job-1.mp4');
	});

	it('deletes staged object when transcription is canceled', async () => {
		const { pollAssemblyAiTranscript } = await import('$lib/server/stt/assemblyai-client');
		vi.mocked(pollAssemblyAiTranscript).mockRejectedValueOnce(new Error('Transcription canceled'));

		const ctx = transcriptionContext(transcriptionJob(), pino({ level: 'silent' }));

		await expect(runTranscriptionJob({} as never, ctx)).rejects.toThrow('Transcription canceled');
		expect(mockR2.deletePublicObject).toHaveBeenCalledWith('transcription/media-1/job-1.mp4');
	});

	it('emits transcript.produced with actorId and causationId from payload', async () => {
		const { log, lines } = capture();

		const job = transcriptionJob({
			payload: JSON.stringify({
				projectId: 'proj-1',
				actorId: 'user-a',
				causationId: 'req-xyz'
			})
		});

		const ctx = transcriptionContext(job, log);
		await runTranscriptionJob({} as never, ctx);

		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatchObject({
			event: 'transcript.produced',
			actorId: 'user-a',
			causationId: 'req-xyz',
			provider: 'assemblyai',
			wordCount: 5,
			speakerCount: 1,
			msg: 'event'
		});
	});
});

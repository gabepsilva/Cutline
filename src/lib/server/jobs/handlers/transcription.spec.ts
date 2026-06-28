import { describe, expect, it, vi } from 'vitest';
import pino from 'pino';
import type { JobRow } from '$lib/server/jobs/job-store';
import type { JobHandlerContext } from '$lib/server/jobs/worker';

function capture() {
	const lines: Record<string, unknown>[] = [];
	const log = pino({ level: 'info' }, { write: (s: string) => lines.push(JSON.parse(s)) });
	return { log, lines };
}

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
		objectKey: 'users/u/projects/p/media/m/source.mp4',
		transcodeKey: null
	})
}));

vi.mock('$lib/server/storage/r2', () => ({
	presignGetObject: vi.fn().mockResolvedValue('https://audio.example/url')
}));

vi.mock('$lib/server/transcript/write-transcript-words', () => ({
	writeTranscript: vi.fn().mockResolvedValue(5)
}));

import { runTranscriptionJob } from './transcription';

describe('runTranscriptionJob events', () => {
	it('emits transcript.produced with actorId and causationId from payload', async () => {
		const { log, lines } = capture();

		const job = {
			id: 'job-1',
			type: 'transcription',
			projectId: 'proj-1',
			status: 'running',
			progress: 0,
			payload: JSON.stringify({
				projectId: 'proj-1',
				actorId: 'user-a',
				causationId: 'req-xyz'
			}),
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
			updatedAt: new Date()
		} satisfies JobRow;

		const ctx: JobHandlerContext = {
			job,
			log,
			reportProgress: vi.fn().mockResolvedValue(undefined),
			isCancelRequested: vi.fn().mockResolvedValue(false),
			complete: vi.fn().mockResolvedValue(undefined)
		};

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

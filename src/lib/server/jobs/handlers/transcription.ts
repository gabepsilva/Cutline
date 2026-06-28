import {
	pollAssemblyAiTranscript,
	readAssemblyAiApiKey,
	submitAssemblyAiTranscript
} from '$lib/server/stt/assemblyai-client';
import { buildSpeakers, mapAssemblyAiWords } from '$lib/server/stt/assemblyai-map';
import { findPrimaryMediaRow } from '$lib/server/storage/media-assets';
import { presignGetObject } from '$lib/server/storage/r2';
import { writeTranscript } from '$lib/server/transcript/write-transcript-words';
import type { Database } from '$lib/server/db/types';
import type { TranscriptionJobPayload } from '$lib/types/job';
import {
	JobCanceledError,
	registerJobHandler,
	type JobHandlerContext
} from '$lib/server/jobs/worker';
import { event } from '$lib/server/log';

function resolveTranscriptionAudioKey(
	mediaRow: Awaited<ReturnType<typeof findPrimaryMediaRow>>
): string {
	if (!mediaRow) {
		throw new Error('No source media found for transcription');
	}

	const objectKey = mediaRow.transcodeKey ?? mediaRow.objectKey;
	if (!objectKey) {
		throw new Error('Media has no presignable object key yet');
	}

	return objectKey;
}

export async function runTranscriptionJob(
	database: Database,
	ctx: JobHandlerContext
): Promise<void> {
	const payload = JSON.parse(ctx.job.payload) as TranscriptionJobPayload;
	// Primary == earliest source upload; treated as A-roll for STT (kind column unreliable — see #190).
	const mediaRow = await findPrimaryMediaRow(database, payload.projectId);

	if (mediaRow?.hasAudio === false) {
		await ctx.reportProgress(1);
		await ctx.complete({ skipped: true, reason: 'no-audio' });
		return;
	}

	const apiKey = readAssemblyAiApiKey();
	const objectKey = resolveTranscriptionAudioKey(mediaRow);
	const audioUrl = await presignGetObject(objectKey);

	await ctx.reportProgress(0.05);

	const transcriptId = await submitAssemblyAiTranscript(audioUrl, apiKey);
	await ctx.reportProgress(0.1);

	const completed = await pollAssemblyAiTranscript(
		transcriptId,
		apiKey,
		(progress) => ctx.reportProgress(progress),
		ctx.isCancelRequested
	);

	if (!completed.words?.length) {
		throw new Error('AssemblyAI returned no words');
	}

	const words = mapAssemblyAiWords(completed.words);
	const speakers = buildSpeakers(completed.words);
	const wordCount = await writeTranscript(database, payload.projectId, words, speakers);
	event(ctx.log, 'transcript.produced', {
		actorId: payload.actorId,
		target: { type: 'project', id: payload.projectId },
		causationId: payload.causationId,
		provider: 'assemblyai',
		wordCount,
		speakerCount: speakers.length
	});
	await ctx.complete({
		provider: 'assemblyai',
		transcriptId,
		wordCount,
		speakerCount: speakers.length
	});
}

export function registerTranscriptionHandler(database: Database): void {
	registerJobHandler('transcription', async (ctx) => {
		try {
			await runTranscriptionJob(database, ctx);
		} catch (error) {
			if (error instanceof Error && error.message === 'Transcription canceled') {
				throw new JobCanceledError();
			}
			throw error;
		}
	});
}

import { eq } from 'drizzle-orm';
import { media, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { JobRow } from '$lib/server/jobs/job-store';
import { enqueueJob, getActiveProjectJob } from '$lib/server/jobs/job-store';
import {
	cleanupIngestOutputs,
	cleanupTempPath,
	readOutputFiles,
	runLocalIngestPipeline,
	writeTempSourceFile
} from '$lib/server/media/ffmpeg-ingest';
import { buildDerivedMediaKeys, extensionFromFilename } from '$lib/server/storage/object-key';
import { getObjectBytes, putObjectBytes, putObjectJson } from '$lib/server/storage/r2';
import type { IngestJobPayload, TranscriptionJobPayload } from '$lib/types/job';
import {
	JobCanceledError,
	registerJobHandler,
	type JobHandlerContext
} from '$lib/server/jobs/worker';
import { event } from '$lib/server/log';
import { parseWords } from '$lib/server/transcript/parse-transcript-words';

async function assertNotCanceled(ctx: JobHandlerContext) {
	if (await ctx.isCancelRequested()) {
		throw new JobCanceledError();
	}
}

async function maybeEnqueueTranscription(
	database: Database,
	projectId: string,
	payload: IngestJobPayload
): Promise<void> {
	const [transcriptRow] = await database
		.select({ words: transcript.words })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	if (parseWords(transcriptRow?.words).length > 0) return;

	const existing = await getActiveProjectJob(database, projectId, 'transcription');
	if (existing) return;

	const transcriptionPayload: TranscriptionJobPayload = {
		projectId,
		actorId: payload.actorId,
		causationId: payload.causationId
	};
	await enqueueJob(database, {
		type: 'transcription',
		projectId,
		payload: transcriptionPayload
	});
}

/** Mark media failed when an ingest job exhausts retries. */
export async function markMediaFailedOnIngestDeadLetter(
	database: Database,
	job: JobRow
): Promise<void> {
	const payload = JSON.parse(job.payload) as Partial<IngestJobPayload>;
	if (!payload.mediaId) return;

	await database.update(media).set({ status: 'failed' }).where(eq(media.id, payload.mediaId));
}

export async function runIngestJob(database: Database, ctx: JobHandlerContext): Promise<void> {
	const payload = JSON.parse(ctx.job.payload) as IngestJobPayload;
	const [row] = await database.select().from(media).where(eq(media.id, payload.mediaId)).limit(1);

	if (!row?.objectKey) {
		throw new Error('Media row is missing source object key');
	}

	await database.update(media).set({ status: 'ingesting' }).where(eq(media.id, payload.mediaId));

	await ctx.reportProgress(0.05);
	await assertNotCanceled(ctx);

	const sourceBytes = await getObjectBytes(row.objectKey);
	const ext = extensionFromFilename(row.objectKey) ?? 'mp4';
	const sourcePath = await writeTempSourceFile(sourceBytes, ext);

	let outputs: Awaited<ReturnType<typeof runLocalIngestPipeline>> | null = null;

	try {
		await ctx.reportProgress(0.15);
		await assertNotCanceled(ctx);

		outputs = await runLocalIngestPipeline(sourcePath);
		const { probe } = outputs;

		await ctx.reportProgress(0.7);
		await assertNotCanceled(ctx);

		const keys = buildDerivedMediaKeys(row.objectKey);
		const files = await readOutputFiles(outputs);

		await putObjectBytes(
			keys.transcodeKey,
			files.transcode,
			probe.hasVideo ? 'video/mp4' : 'audio/mp4'
		);
		if (files.filmstrip && outputs.filmstripMeta) {
			await putObjectBytes(keys.filmstripKey, files.filmstrip, 'image/jpeg');
			await putObjectJson(keys.filmstripMetaKey, outputs.filmstripMeta);
		}
		await putObjectJson(keys.waveformKey, outputs.waveform);

		await database
			.update(media)
			.set({
				status: 'ready',
				transcodeKey: keys.transcodeKey,
				filmstripKey: outputs.filmstripMeta ? keys.filmstripKey : null,
				waveformKey: keys.waveformKey,
				width: probe.width,
				height: probe.height,
				hasAudio: probe.hasAudio,
				durationSeconds: Math.max(1, Math.round(probe.durationSeconds))
			})
			.where(eq(media.id, payload.mediaId));

		if (row.kind === 'A-roll' && probe.hasAudio) {
			await maybeEnqueueTranscription(database, row.projectId, payload);
		}

		event(ctx.log, 'media.ingested', {
			actorId: payload.actorId,
			target: { type: 'media', id: payload.mediaId },
			causationId: payload.causationId
		});

		await ctx.reportProgress(1);
		await ctx.complete({
			transcodeKey: keys.transcodeKey,
			waveformKey: keys.waveformKey,
			...(outputs.filmstripMeta ? { filmstripKey: keys.filmstripKey } : {})
		});
	} finally {
		await cleanupTempPath(sourcePath);
		if (outputs) {
			await cleanupIngestOutputs(outputs);
		}
	}
}

export function registerIngestHandler(database: Database): void {
	registerJobHandler('ingest', async (ctx) => {
		await runIngestJob(database, ctx);
	});
}

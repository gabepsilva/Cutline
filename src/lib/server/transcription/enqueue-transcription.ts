import { assertProjectOwned } from '$lib/server/project-access';
import type { Database } from '$lib/server/db/types';
import { enqueueJob, getActiveProjectJob } from '$lib/server/jobs/job-store';
import type { ServerError } from '$lib/server/result';
import { findPrimaryMediaRow } from '$lib/server/storage/media-assets';
import type { TranscriptionJobPayload } from '$lib/types/job';

export type EnqueueManualTranscriptionResult = { ok: true; jobId: string } | ServerError;

/** Auto-chain transcription when primary media ingest finishes (#212). */
export async function enqueueTranscriptionAfterIngest(
	database: Database,
	projectId: string,
	mediaId: string,
	options?: { actorId?: string; causationId?: string }
): Promise<string | null> {
	const primaryMedia = await findPrimaryMediaRow(database, projectId);
	if (!primaryMedia || primaryMedia.id !== mediaId) {
		return null;
	}

	if (primaryMedia.status !== 'ready') {
		return null;
	}

	if (primaryMedia.hasAudio === false) {
		return null;
	}

	const existing = await getActiveProjectJob(database, projectId, 'transcription');
	if (existing) {
		return null;
	}

	const payload: TranscriptionJobPayload = {
		projectId,
		actorId: options?.actorId,
		causationId: options?.causationId
	};

	const { id } = await enqueueJob(database, {
		type: 'transcription',
		projectId,
		payload
	});

	return id;
}

/** User-triggered transcription for the project's primary source clip (#191). */
export async function enqueueManualTranscription(
	database: Database,
	userId: string,
	projectId: string,
	causationId?: string
): Promise<EnqueueManualTranscriptionResult> {
	const ownerError = await assertProjectOwned(database, userId, projectId);
	if (ownerError) {
		return ownerError;
	}

	const primaryMedia = await findPrimaryMediaRow(database, projectId);
	if (!primaryMedia) {
		return { ok: false, status: 404, message: 'No source media found' };
	}

	if (primaryMedia.status !== 'ready') {
		return { ok: false, status: 400, message: 'Source media is not ready' };
	}

	if (primaryMedia.hasAudio === false) {
		return { ok: false, status: 400, message: 'No audio in source media' };
	}

	const existing = await getActiveProjectJob(database, projectId, 'transcription');
	if (existing) {
		return { ok: false, status: 400, message: 'Transcription already in progress' };
	}

	const payload: TranscriptionJobPayload = {
		projectId,
		actorId: userId,
		causationId
	};

	const { id } = await enqueueJob(database, {
		type: 'transcription',
		projectId,
		payload
	});

	return { ok: true, jobId: id };
}

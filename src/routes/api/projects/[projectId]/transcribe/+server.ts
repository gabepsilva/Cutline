import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { kickWorker } from '$lib/server/jobs/worker';
import { event } from '$lib/server/log';
import { isServerError } from '$lib/server/result';
import { enqueueManualTranscription } from '$lib/server/transcription/enqueue-transcription';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const result = await enqueueManualTranscription(
		db,
		locals.user.id,
		params.projectId,
		locals.requestId
	);

	if (isServerError(result)) {
		error(result.status, result.message);
	}

	kickWorker(db);

	event(locals.log, 'transcription.requested', {
		actorId: locals.user.id,
		target: { type: 'project', id: params.projectId },
		causationId: locals.requestId,
		jobId: result.jobId
	});

	return json({ id: result.jobId });
};

import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { completeMediaUpload, parseCompleteUploadBody } from '$lib/server/storage/media-upload';
import { isServerError } from '$lib/server/result';
import { event } from '$lib/server/log';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const parsed = parseCompleteUploadBody(body);
	if (isServerError(parsed)) {
		error(parsed.status, parsed.message);
	}

	try {
		const result = await completeMediaUpload(
			db,
			locals.user.id,
			params.projectId,
			params.mediaId,
			parsed,
			locals.requestId
		);
		if (isServerError(result)) {
			error(result.status, result.message);
		}
		event(locals.log, 'media.upload.completed', {
			actorId: locals.user.id,
			target: { type: 'media', id: params.mediaId },
			causationId: locals.requestId,
			jobId: result.jobId
		});
		return json({ jobId: result.jobId });
	} catch (cause) {
		if (isHttpError(cause)) throw cause;
		const message = cause instanceof Error ? cause.message : 'Upload complete failed';
		error(500, message);
	}
};

import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { createMediaUploadUrl, parseUploadUrlBody } from '$lib/server/storage/media-upload';
import { isServerError } from '$lib/server/result';

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

	const parsed = parseUploadUrlBody(body);
	if (isServerError(parsed)) {
		error(parsed.status, parsed.message);
	}

	try {
		const result = await createMediaUploadUrl(db, locals.user.id, params.projectId, parsed);
		if (isServerError(result)) {
			error(result.status, result.message);
		}
		return json(result);
	} catch (cause) {
		if (isHttpError(cause)) throw cause;
		const message = cause instanceof Error ? cause.message : 'Upload presign failed';
		error(500, message);
	}
};

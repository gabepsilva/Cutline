import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { initProjectMediaUpload, parseInitUploadUrlBody } from '$lib/server/storage/media-upload';
import { isServerError } from '$lib/server/result';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const parsed = parseInitUploadUrlBody(body);
	if (isServerError(parsed)) {
		error(parsed.status, parsed.message);
	}

	const titleCheck = parsed.title.trim();
	if (!titleCheck) {
		error(400, 'Title is required');
	}

	try {
		const result = await initProjectMediaUpload(db, locals.user.id, parsed);
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

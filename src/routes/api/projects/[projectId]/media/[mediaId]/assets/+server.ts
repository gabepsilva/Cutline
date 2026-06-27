import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { getMediaAssetUrls } from '$lib/server/storage/media-assets';
import { isServerError } from '$lib/server/result';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	try {
		const result = await getMediaAssetUrls(db, locals.user.id, params.projectId, params.mediaId);
		if (isServerError(result)) {
			error(result.status, result.message);
		}
		return json(result);
	} catch (cause) {
		if (isHttpError(cause)) throw cause;
		const message = cause instanceof Error ? cause.message : 'Failed to load media assets';
		error(500, message);
	}
};

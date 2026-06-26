import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requestJobCancel } from '$lib/server/jobs/job-store';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const cancelError = await requestJobCancel(db, locals.user.id, params.id);
	if (cancelError) {
		error(cancelError.status, cancelError.message);
	}

	return json({ ok: true });
};

import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { requestJobCancel } from '$lib/server/jobs/job-store';
import { event } from '$lib/server/log';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const cancelError = await requestJobCancel(db, locals.user.id, params.id);
	if (cancelError) {
		error(cancelError.status, cancelError.message);
	}

	event(locals.log, 'job.canceled', {
		actorId: locals.user.id,
		target: { type: 'job', id: params.id }
	});

	return json({ ok: true });
};

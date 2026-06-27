import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { getOwnedJobStatus } from '$lib/server/jobs/job-store';
import { kickWorker } from '$lib/server/jobs/worker';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	const result = await getOwnedJobStatus(db, locals.user.id, params.id);
	if (!result.ok) {
		error(result.status, result.message);
	}

	if (result.data?.status === 'queued') {
		kickWorker(db);
	}

	return json(result.data!);
};

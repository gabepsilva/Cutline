import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { enqueueOwnedJob, parseEnqueueBody } from '$lib/server/jobs/job-store';
import { kickWorker } from '$lib/server/jobs/worker';
import type { RequestHandler } from './$types';

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

	const parsed = parseEnqueueBody(body);
	if (!parsed.ok || !parsed.data) {
		error(
			parsed.ok === false ? parsed.status : 400,
			parsed.ok === false ? parsed.message : 'Invalid body'
		);
	}

	const result = await enqueueOwnedJob(
		db,
		locals.user.id,
		params.projectId,
		parsed.data.type,
		parsed.data.payload
	);

	if (!result.ok) {
		error(result.status, result.message);
	}

	kickWorker(db);

	return json({ id: result.jobId });
};

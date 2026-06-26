import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	parsePersistEditorBody,
	persistEditorProject
} from '$lib/server/editor-transcript-persist';
import { isServerError } from '$lib/server/result';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		error(401, 'Unauthorized');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const parsed = parsePersistEditorBody(body);
	if (isServerError(parsed)) {
		error(parsed.status, parsed.message);
	}

	const result = await persistEditorProject(db, locals.user.id, params.id, parsed);
	if (!result.ok) {
		error(result.status, result.message);
	}

	return json({ ok: true });
};

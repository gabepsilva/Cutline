import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	isPersistEditorTranscriptError,
	parsePersistEditorTranscriptBody,
	persistEditorProject
} from '$lib/server/editor-transcript-persist';
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

	const parsed = parsePersistEditorTranscriptBody(body);
	if (isPersistEditorTranscriptError(parsed)) {
		error(parsed.status, parsed.message);
	}

	const result = await persistEditorProject(db, locals.user.id, params.id, parsed);
	if (!result.ok) {
		error(result.status, result.message);
	}

	return json({ ok: true });
};

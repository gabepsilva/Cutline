/** POST /api/projects/:projectId/transcribe — returns the enqueued job id. */
export async function requestTranscription(projectId: string): Promise<string> {
	const response = await fetch(`/api/projects/${projectId}/transcribe`, { method: 'POST' });

	if (!response.ok) {
		let message = `Transcription request failed (${response.status})`;
		try {
			const body = (await response.json()) as { message?: string };
			if (body.message) message = body.message;
		} catch {
			// Ignore non-JSON error bodies.
		}
		throw new Error(message);
	}

	const body = (await response.json()) as { id: string };
	return body.id;
}

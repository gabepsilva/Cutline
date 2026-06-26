import type { EditorState } from './editor-state.svelte';
import type { ExportConfig } from '$lib/components/editor/modals/ExportModal.types';
import type { JobStatusResponse } from '$lib/types/job';

const POLL_INTERVAL_MS = 1_000;

async function readJson<T>(response: Response): Promise<T> {
	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}
	return (await response.json()) as T;
}

/** Enqueues an export job and polls status until terminal. Replaces the old setInterval mock. */
export function startExportJob(
	editor: EditorState,
	projectId: string,
	config: ExportConfig
): () => void {
	let stopped = false;
	let jobId: string | null = null;
	let pollTimer: ReturnType<typeof setInterval> | undefined;

	const stop = (options: { cancel?: boolean } = {}) => {
		stopped = true;
		if (pollTimer) clearInterval(pollTimer);
		if (options.cancel && jobId) {
			void Promise.resolve(fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' })).catch(
				() => undefined
			);
		}
	};

	void (async () => {
		try {
			const enqueueResponse = await fetch(`/api/projects/${projectId}/jobs`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ type: 'export', payload: config })
			});

			const { id } = await readJson<{ id: string }>(enqueueResponse);
			jobId = id;

			const poll = async () => {
				if (stopped || !jobId) return;

				const statusResponse = await fetch(`/api/jobs/${jobId}`);
				const status = await readJson<JobStatusResponse>(statusResponse);

				editor.setExportProgress(status.progress);

				if (status.status === 'succeeded') {
					editor.markExportDone();
					stop();
					return;
				}

				if (status.status === 'failed' || status.status === 'canceled') {
					editor.closeExport();
					stop();
				}
			};

			await poll();
			if (stopped) return;

			pollTimer = setInterval(() => {
				void poll().catch(() => {
					editor.closeExport();
					stop();
				});
			}, POLL_INTERVAL_MS);
		} catch {
			editor.closeExport();
			stop();
		}
	})();

	return () => stop({ cancel: true });
}

export function exportFilename(projectTitle: string, format: string): string {
	const slug = projectTitle
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${slug || 'export'}.${format}`;
}

import type { CaptionStyle, Word } from '$lib/types/transcript';
import type { Overlay } from '$lib/types/timeline';

export type EditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const EDITOR_AUTOSAVE_DELAY_MS = 1_000;

export interface EditorAutosavePayload {
	words: Word[];
	captionStyle: CaptionStyle;
	overlays: Overlay[];
}

export function editorSaveMeta(status: EditorSaveStatus, baselineMeta: string): string {
	switch (status) {
		case 'saving':
			return 'Saving…';
		case 'saved':
			return 'Saved';
		case 'error':
			return 'Save failed';
		default:
			return baselineMeta;
	}
}

export function createEditorAutosave(options: {
	delayMs?: number;
	fetchFn?: typeof fetch;
	onStatus: (status: EditorSaveStatus) => void;
}) {
	const delayMs = options.delayMs ?? EDITOR_AUTOSAVE_DELAY_MS;
	const fetchFn = options.fetchFn ?? fetch;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let inFlight: AbortController | undefined;
	let requestId = 0;
	let pending: { projectId: string; payload: EditorAutosavePayload } | undefined;

	const setStatus = (status: EditorSaveStatus) => {
		options.onStatus(status);
	};

	const cancelTimer = () => {
		if (timer !== undefined) {
			clearTimeout(timer);
			timer = undefined;
		}
	};

	const saveNow = async (projectId: string, payload: EditorAutosavePayload) => {
		cancelTimer();
		inFlight?.abort();

		const controller = new AbortController();
		inFlight = controller;
		const currentRequest = ++requestId;

		setStatus('saving');

		try {
			const response = await fetchFn(`/projects/${projectId}`, {
				method: 'PUT',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload),
				signal: controller.signal
			});

			if (currentRequest !== requestId) return;

			if (!response.ok) {
				setStatus('error');
				return;
			}

			setStatus('saved');
		} catch {
			if (controller.signal.aborted || currentRequest !== requestId) return;
			setStatus('error');
		} finally {
			if (inFlight === controller) {
				inFlight = undefined;
			}
		}
	};

	return {
		schedule(projectId: string, payload: EditorAutosavePayload) {
			pending = { projectId, payload };
			cancelTimer();
			timer = setTimeout(() => {
				timer = undefined;
				if (!pending) return;
				void saveNow(pending.projectId, pending.payload);
			}, delayMs);
		},
		flush(projectId: string, payload: EditorAutosavePayload) {
			void saveNow(projectId, payload);
		},
		dispose() {
			cancelTimer();
			pending = undefined;
			inFlight?.abort();
			inFlight = undefined;
		}
	};
}

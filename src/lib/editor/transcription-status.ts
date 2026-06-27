import { env } from '$env/dynamic/public';
import { buildMockTranscript } from '$lib/mocks/editor.mock';
import type { JobStatusResponse } from '$lib/types/job';
import type { TranscriptUiStatus } from '$lib/types/transcript-ui';
import { transcriptionProgress } from '$lib/types/transcript-ui';
import type { ARollMediaLoad } from '$lib/types/editor-load';

const POLL_INTERVAL_MS = 1_500;
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled']);

function mockDurationMs(): number {
	if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
		return 400;
	}

	const raw = env.PUBLIC_MOCK_TRANSCRIPTION_MS;
	if (raw == null || raw === '') return 15_000;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 15_000;
}

async function readJson<T>(response: Response): Promise<T> {
	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}
	return (await response.json()) as T;
}

export interface TranscriptionUiState {
	status: TranscriptUiStatus;
	progress: number;
	stage: string;
}

export function resolveTranscriptUiStatus(input: {
	wordCount: number;
	aRoll: ARollMediaLoad | null;
	jobStatus: JobStatusResponse | null;
	mockActive: boolean;
}): TranscriptUiStatus {
	if (input.wordCount > 0) return 'ready';

	const hasUploadedRoll = Boolean(
		input.aRoll &&
		(input.aRoll.status === 'uploaded' ||
			input.aRoll.status === 'ingesting' ||
			input.aRoll.status === 'ready')
	);

	if (input.mockActive) return 'transcribing';
	if (input.jobStatus && !TERMINAL_STATUSES.has(input.jobStatus.status)) return 'transcribing';
	if (input.jobStatus?.status === 'failed') return 'unavailable';
	if (hasUploadedRoll) return 'transcribing';

	return 'unavailable';
}

export function shouldUseMockTranscription(input: {
	wordCount: number;
	transcriptionJobId: string | null;
	aRoll: ARollMediaLoad | null;
}): boolean {
	if (input.wordCount > 0 || input.transcriptionJobId) return false;
	if (!input.aRoll) return false;
	return (
		input.aRoll.status === 'uploaded' ||
		input.aRoll.status === 'ingesting' ||
		input.aRoll.status === 'ready'
	);
}

async function persistMockTranscript(projectId: string): Promise<void> {
	const { words } = buildMockTranscript();
	const response = await fetch(`/projects/${projectId}`, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			words,
			captionStyle: 'karaoke',
			overlays: []
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to persist mock transcript (${response.status})`);
	}
}

/** Poll a transcription job until terminal, invoking `onUpdate` on each tick. */
export function pollTranscriptionJob(
	jobId: string,
	onUpdate: (status: JobStatusResponse) => void,
	onTerminal: (status: JobStatusResponse) => void,
	intervalMs = POLL_INTERVAL_MS
): () => void {
	let stopped = false;

	const tick = async () => {
		while (!stopped) {
			try {
				const status = await readJson<JobStatusResponse>(await fetch(`/api/jobs/${jobId}`));
				onUpdate(status);
				if (TERMINAL_STATUSES.has(status.status)) {
					onTerminal(status);
					return;
				}
			} catch {
				// Keep polling through transient network errors.
			}
			await new Promise((resolve) => setTimeout(resolve, intervalMs));
		}
	};

	void tick();

	return () => {
		stopped = true;
	};
}

/**
 * MOCK: Emulates ~15s async transcription when no #141 worker job exists yet.
 * TODO(service): Remove when real transcription jobs always enqueue on upload (#141).
 */
export function pollMockTranscription(
	projectId: string,
	onUpdate: (progress: number) => void,
	onComplete: () => void
): () => void {
	let stopped = false;
	const startedAt = Date.now();
	const durationMs = mockDurationMs();

	const tick = () => {
		if (stopped) return;

		const elapsed = Date.now() - startedAt;
		const progress = Math.min(1, elapsed / durationMs);
		onUpdate(progress);

		if (progress >= 1) {
			void persistMockTranscript(projectId)
				.then(onComplete)
				.catch(() => undefined);
			return;
		}

		globalThis.setTimeout(tick, 100);
	};

	globalThis.setTimeout(tick, 100);

	return () => {
		stopped = true;
	};
}

export function toTranscriptionUiState(
	status: TranscriptUiStatus,
	progress: number
): TranscriptionUiState {
	const { stage } = transcriptionProgress(progress);
	return { status, progress, stage };
}

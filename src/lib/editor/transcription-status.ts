import type { JobStatusResponse } from '$lib/types/job';
import type { TranscriptUiStatus } from '$lib/types/transcript-ui';
import { transcriptionProgress } from '$lib/types/transcript-ui';
import type { ARollMediaLoad } from '$lib/types/editor-load';

const POLL_INTERVAL_MS = 1_500;
const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'canceled']);

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
	/** Latest transcription job ended non-succeeded with none active (from server load). */
	failed?: boolean;
}): TranscriptUiStatus {
	if (input.wordCount > 0) return 'ready';

	if (input.aRoll?.hasAudio === false && input.aRoll.status === 'ready') {
		return 'no-audio';
	}

	const hasUploadedRoll = Boolean(
		input.aRoll &&
		(input.aRoll.status === 'uploaded' ||
			input.aRoll.status === 'ingesting' ||
			input.aRoll.status === 'ready')
	);

	if (input.jobStatus && !TERMINAL_STATUSES.has(input.jobStatus.status)) return 'transcribing';

	if (input.jobStatus && input.jobStatus.status !== 'succeeded') return 'unavailable';

	if (input.failed) return 'unavailable';

	if (hasUploadedRoll) return 'transcribing';

	return 'unavailable';
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

export function toTranscriptionUiState(
	status: TranscriptUiStatus,
	progress: number
): TranscriptionUiState {
	const { stage } = transcriptionProgress(progress);
	return { status, progress, stage };
}

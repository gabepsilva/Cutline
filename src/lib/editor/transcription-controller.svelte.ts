import { invalidateAll } from '$app/navigation';
import { requestTranscription } from '$lib/editor/request-transcription';
import {
	pollTranscriptionJob,
	resolveTranscriptUiStatus,
	toTranscriptionUiState,
	type TranscriptionUiState
} from '$lib/editor/transcription-status';
import type { ARollMediaLoad } from '$lib/types/editor-load';
import type { JobStatusResponse } from '$lib/types/job';

export class TranscriptionController {
	jobStatus = $state<JobStatusResponse | null>(null);
	/** Client-side job id after a manual transcribe request, before server load catches up. */
	pendingJobId = $state<string | null>(null);
	requesting = $state(false);
	requestError = $state<string | null>(null);

	constructor(
		private readWordCount: () => number,
		private readARoll: () => ARollMediaLoad | null,
		private readFailed: () => boolean = () => false
	) {}

	ui = $derived.by((): TranscriptionUiState => {
		const progress = this.jobStatus?.progress ?? 0;
		const status = resolveTranscriptUiStatus({
			wordCount: this.readWordCount(),
			aRoll: this.readARoll(),
			jobStatus: this.jobStatus,
			failed: this.readFailed() && !this.pendingJobId
		});
		return toTranscriptionUiState(status, progress);
	});

	/** Starts polling when a job id is present; call from `$effect` and return the cleanup. */
	bind(jobId: string | null): () => void {
		if (this.readWordCount() > 0) {
			this.jobStatus = null;
			return () => {};
		}

		if (!jobId) {
			this.jobStatus = null;
			return () => {};
		}

		let canceled = false;
		const stop = pollTranscriptionJob(
			jobId,
			(status) => {
				if (!canceled) this.jobStatus = status;
			},
			(status) => {
				if (!canceled) {
					this.jobStatus = status;
					this.pendingJobId = null;
					if (status.status === 'succeeded') {
						void invalidateAll();
					}
				}
			}
		);

		return () => {
			canceled = true;
			stop();
		};
	}

	async request(projectId: string): Promise<void> {
		if (this.requesting) return;

		this.requesting = true;
		this.requestError = null;

		try {
			const jobId = await requestTranscription(projectId);
			this.pendingJobId = jobId;
			this.jobStatus = { status: 'queued', progress: 0 };
		} catch (error) {
			this.requestError = error instanceof Error ? error.message : 'Transcription request failed';
		} finally {
			this.requesting = false;
		}
	}
}

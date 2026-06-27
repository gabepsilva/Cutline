import { invalidateAll } from '$app/navigation';
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
			failed: this.readFailed()
		});
		return toTranscriptionUiState(status, progress);
	});

	/** Starts polling when a job id is present; call from `$effect` and return the cleanup. */
	bind(jobId: string | null): () => void {
		if (this.readWordCount() > 0 || !jobId) {
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
}

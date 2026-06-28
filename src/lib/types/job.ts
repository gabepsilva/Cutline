export const JOB_TYPES = ['ingest', 'transcription', 'export'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'canceled'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const TERMINAL_JOB_STATUSES = ['succeeded', 'failed', 'canceled'] as const;
export type TerminalJobStatus = (typeof TERMINAL_JOB_STATUSES)[number];

export interface ExportJobPayload {
	format: string;
	resolution: string;
	burnCaptions: boolean;
}

export interface IngestJobPayload {
	mediaId: string;
	actorId?: string;
	causationId?: string;
}

export interface TranscriptionJobPayload {
	projectId: string;
	actorId?: string;
	causationId?: string;
}

export interface JobStatusResponse {
	status: JobStatus;
	progress: number;
	result?: unknown;
	error?: string;
}

export interface EnqueueJobInput {
	type: JobType;
	projectId: string;
	payload: unknown;
	priority?: number;
	maxAttempts?: number;
}

/** Parsed POST body — projectId comes from the route param, not the body. */
export type EnqueueBodyInput = Omit<EnqueueJobInput, 'projectId'>;

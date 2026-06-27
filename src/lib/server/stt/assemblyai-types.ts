export type AssemblyAiTranscriptStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface AssemblyAiWord {
	text: string;
	start: number;
	end: number;
	confidence: number;
	speaker?: string;
}

export interface AssemblyAiTranscript {
	id: string;
	status: AssemblyAiTranscriptStatus;
	error?: string;
	words?: AssemblyAiWord[];
}

export interface AssemblyAiCreateResponse {
	id: string;
}

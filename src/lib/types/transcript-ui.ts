/** Transcript pane UI mode — independent of persisted word count during async STT. */
export type TranscriptUiStatus = 'ready' | 'transcribing' | 'unavailable';

export interface TranscriptionProgress {
	progress: number;
	stage: string;
}

export function formatTranscriptionPercent(progress: number): string {
	return `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`;
}

/** Design copy for async transcription stages (Cutline.dc.html ~1132). */
export function transcriptionStage(progress: number): string {
	if (progress < 0.45) return 'Detecting speech…';
	if (progress < 0.8) return 'Generating transcript…';
	return 'Aligning words to timeline…';
}

export function transcriptionProgress(progress: number): TranscriptionProgress {
	const clamped = Math.max(0, Math.min(1, progress));
	return {
		progress: clamped,
		stage: transcriptionStage(clamped)
	};
}

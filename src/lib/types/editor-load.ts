import type { TranscriptSpeakerData } from '$lib/components/editor/transcript/TranscriptSpeaker.types';
import type { MediaResource } from '$lib/types/media';
import type { MediaStatus } from '$lib/types/media-upload';
import type { Project } from '$lib/types/project';
import type { Overlay } from '$lib/types/timeline';
import type { ARollSegment } from '$lib/types/segment';
import type { CaptionStyle, Sentence, TranscriptSpeaker, Word } from '$lib/types/transcript';

export type ProjectRouteMode = 'import' | 'editor';

/** Primary uploaded A-roll media for timeline ingest assets (M8-02). */
export interface ARollMediaLoad {
	mediaId: string;
	status: MediaStatus;
	videoUrl: string | null;
	/** Null until ingest probe; false when the clip has no audio stream. */
	hasAudio: boolean | null;
}

/** Server load shape for the editor route — consumed by `EditorWorkspace` / import shell. */
export interface EditorProjectLoad {
	mode: ProjectRouteMode;
	project: Project;
	meta: string;
	words: Word[];
	captionStyle: CaptionStyle;
	sentences: Sentence[];
	/** Fallback header for single-speaker / undiarized transcripts (the project owner). */
	speaker: TranscriptSpeakerData;
	/** Diarized speaker roster from STT; empty when the transcript is single-speaker (M9-01). */
	speakers: TranscriptSpeaker[];
	videoUrl: string | null;
	aRoll: ARollMediaLoad | null;
	resources: MediaResource[];
	overlays: Overlay[];
	/** Ordered A-roll storyline segments (empty until migration / first upload). */
	segments: ARollSegment[];
	/** Sum of segment durations — drives timeline length when > 0 (#205). */
	sequenceDurationSeconds: number;
	/** Active transcription job id when STT is in flight (#137 / #141). */
	transcriptionJobId: string | null;
	/** True when the latest transcription job ended non-succeeded and none is active (show "unavailable" on reload). */
	transcriptionFailed: boolean;
}

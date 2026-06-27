import type { TranscriptSpeakerData } from '$lib/components/editor/transcript/TranscriptSpeaker.types';
import type { MediaResource } from '$lib/types/media';
import type { MediaStatus } from '$lib/types/media-upload';
import type { Project } from '$lib/types/project';
import type { Overlay } from '$lib/types/timeline';
import type { CaptionStyle, Sentence, Word } from '$lib/types/transcript';

export type ProjectRouteMode = 'import' | 'editor';

/** Primary uploaded A-roll media for timeline ingest assets (M8-02). */
export interface ARollMediaLoad {
	mediaId: string;
	status: MediaStatus;
	videoUrl: string | null;
}

/** Server load shape for the editor route — consumed by `EditorWorkspace` / import shell. */
export interface EditorProjectLoad {
	mode: ProjectRouteMode;
	project: Project;
	meta: string;
	words: Word[];
	captionStyle: CaptionStyle;
	sentences: Sentence[];
	speaker: TranscriptSpeakerData;
	videoUrl: string | null;
	aRoll: ARollMediaLoad | null;
	resources: MediaResource[];
	overlays: Overlay[];
	/** Active transcription job id when STT is in flight (#137 / #141). */
	transcriptionJobId: string | null;
	/** True when the latest transcription job ended non-succeeded and none is active (show "unavailable" on reload). */
	transcriptionFailed: boolean;
}

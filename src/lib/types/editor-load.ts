import type { TranscriptSpeakerData } from '$lib/components/editor/transcript/TranscriptSpeaker.types';
import type { MediaResource } from '$lib/types/media';
import type { MediaStatus } from '$lib/types/media-upload';
import type { Project } from '$lib/types/project';
import type { Overlay } from '$lib/types/timeline';
import type { CaptionStyle, Sentence, Word } from '$lib/types/transcript';

/** Primary uploaded A-roll media for timeline ingest assets (M8-02). */
export interface ARollMediaLoad {
	mediaId: string;
	status: MediaStatus;
	videoUrl: string | null;
}

/** Server load shape for the editor route — consumed by `EditorWorkspace`. */
export interface EditorProjectLoad {
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
}

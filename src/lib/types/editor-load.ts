import type { TranscriptSpeakerData } from '$lib/components/editor/transcript/TranscriptSpeaker.types';
import type { MediaResource } from '$lib/types/media';
import type { Project } from '$lib/types/project';
import type { CaptionStyle, Sentence, Word } from '$lib/types/transcript';

/** Server load shape for the editor route — consumed by `EditorWorkspace`. */
export interface EditorProjectLoad {
	project: Project;
	meta: string;
	words: Word[];
	captionStyle: CaptionStyle;
	sentences: Sentence[];
	speaker: TranscriptSpeakerData;
	videoUrl: string | null;
	resources: MediaResource[];
}

import { eq } from 'drizzle-orm';
import type { User } from 'better-auth';
import { deriveSentences } from '$lib/editor/derive-sentences';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { mapMediaRow, mapOverlayRow } from '$lib/server/map-editor-rows';
import { mapProjectRow } from '$lib/server/map-project-row';
import { resolveProjectRouteMode } from '$lib/server/project-route-mode';
import { ownedProjectFilter } from '$lib/server/project-access';
import { isServerError } from '$lib/server/result';
import { findPrimaryMediaRow, getMediaAssetUrls } from '$lib/server/storage/media-assets';
import { getLatestProjectJob } from '$lib/server/jobs/job-store';
import type { EditorProjectLoad } from '$lib/types/editor-load';
import type { MediaStatus } from '$lib/types/media-upload';
import { parseWords } from '$lib/server/transcript/parse-transcript-words';
import type { CaptionStyle, TranscriptSpeaker, Word } from '$lib/types/transcript';
import { deriveUserInitials } from '$lib/utils/user-initials';

function parseSpeakers(raw: string | null | undefined): TranscriptSpeaker[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as TranscriptSpeaker[]) : [];
	} catch {
		return [];
	}
}

function editorMeta(words: Word[]): string {
	return words.length === 0 ? 'Draft · no transcript' : 'Auto-saved';
}

/** Owner-gated editor load — returns null when the project is missing or not owned. */
export async function loadEditorProject(
	database: Database,
	user: User,
	projectId: string
): Promise<EditorProjectLoad | null> {
	const [row] = await database
		.select()
		.from(project)
		.where(ownedProjectFilter(user.id, projectId))
		.limit(1);

	if (!row) return null;

	const [transcriptRows, mediaRows, overlayRows] = await Promise.all([
		database.select().from(transcript).where(eq(transcript.projectId, projectId)),
		database.select().from(media).where(eq(media.projectId, projectId)),
		database.select().from(overlay).where(eq(overlay.projectId, projectId))
	]);
	const transcriptRow = transcriptRows[0];

	const words = parseWords(transcriptRow?.words);
	const speakers = parseSpeakers(transcriptRow?.speakers);
	const captionStyle = (transcriptRow?.captionStyle as CaptionStyle | undefined) ?? 'karaoke';

	const primaryMedia = await findPrimaryMediaRow(database, projectId);
	let aRoll: EditorProjectLoad['aRoll'] = null;
	let videoUrl: string | null = null;

	if (primaryMedia) {
		const status = primaryMedia.status as MediaStatus;
		aRoll = {
			mediaId: primaryMedia.id,
			status,
			videoUrl: null,
			hasAudio: primaryMedia.hasAudio
		};

		if (status === 'ready') {
			const assets = await getMediaAssetUrls(database, user.id, projectId, primaryMedia.id);
			if (!isServerError(assets)) {
				videoUrl = assets.transcodeUrl;
				aRoll = { ...aRoll, videoUrl: assets.transcodeUrl };
			}
		}
	}

	const mode = resolveProjectRouteMode(mediaRows.map((row) => row.status as MediaStatus));
	const latestTranscriptionJob =
		words.length === 0 ? await getLatestProjectJob(database, projectId, 'transcription') : null;
	const transcriptionActive =
		latestTranscriptionJob?.status === 'queued' || latestTranscriptionJob?.status === 'running';
	const transcriptionFailed =
		latestTranscriptionJob != null &&
		!transcriptionActive &&
		latestTranscriptionJob.status !== 'succeeded';

	return {
		mode,
		project: mapProjectRow(row),
		meta: editorMeta(words),
		words,
		captionStyle,
		sentences: deriveSentences(words),
		speaker: {
			name: user.name,
			initials: deriveUserInitials(user.name)
		},
		speakers,
		videoUrl,
		aRoll,
		resources: mediaRows.map(mapMediaRow),
		overlays: overlayRows.map(mapOverlayRow),
		transcriptionJobId: transcriptionActive ? (latestTranscriptionJob?.id ?? null) : null,
		transcriptionFailed
	};
}

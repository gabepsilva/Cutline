import { eq } from 'drizzle-orm';
import type { User } from 'better-auth';
import { deriveSentences } from '$lib/editor/derive-sentences';
import { media, overlay, project, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { mapProjectRow } from '$lib/server/map-project-row';
import { ownedProjectFilter } from '$lib/server/project-access';
import type { EditorProjectLoad } from '$lib/types/editor-load';
import type { MediaResource } from '$lib/types/media';
import type { Overlay } from '$lib/types/timeline';
import type { CaptionStyle, Word } from '$lib/types/transcript';
import { deriveUserInitials } from '$lib/utils/user-initials';

function parseWords(raw: string | null | undefined): Word[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? (parsed as Word[]) : [];
	} catch {
		return [];
	}
}

function mapMediaRow(row: typeof media.$inferSelect): MediaResource {
	return {
		id: row.id,
		name: row.name,
		dur: row.durationSeconds,
		kind: row.kind,
		thumb: row.thumb
	};
}

function mapOverlayRow(row: typeof overlay.$inferSelect): Overlay {
	return {
		id: row.id,
		resId: row.mediaId,
		name: row.name,
		start: row.startSeconds,
		dur: row.durationSeconds,
		thumb: row.thumb
	};
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
	const captionStyle = (transcriptRow?.captionStyle as CaptionStyle | undefined) ?? 'karaoke';

	return {
		project: mapProjectRow(row),
		meta: editorMeta(words),
		words,
		captionStyle,
		sentences: deriveSentences(words),
		speaker: {
			name: user.name,
			initials: deriveUserInitials(user.name)
		},
		videoUrl: null,
		resources: mediaRows.map(mapMediaRow),
		overlays: overlayRows.map(mapOverlayRow)
	};
}

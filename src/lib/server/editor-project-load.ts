import { and, eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { User } from 'better-auth';
import { deriveSentences } from '$lib/editor/derive-sentences';
import { media, project, transcript } from '$lib/server/db/domain.schema';
import type * as schema from '$lib/server/db/schema';
import { mapProjectRow } from '$lib/server/map-project-row';
import type { EditorProjectLoad } from '$lib/types/editor-load';
import type { MediaResource } from '$lib/types/media';
import type { CaptionStyle, Word } from '$lib/types/transcript';
import { deriveUserInitials } from '$lib/utils/user-initials';

type Database = LibSQLDatabase<typeof schema>;

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
		.where(and(eq(project.id, projectId), eq(project.userId, user.id)))
		.limit(1);

	if (!row) return null;

	const [transcriptRow] = await database
		.select()
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	const mediaRows = await database.select().from(media).where(eq(media.projectId, projectId));

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
		resources: mediaRows.map(mapMediaRow)
	};
}

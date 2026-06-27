import { createClient } from '@libsql/client';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import {
	buildMockTranscript,
	MOCK_EMPTY_TRANSCRIPT_PROJECT_ID,
	mockEditorResources
} from '../src/lib/mocks/editor.mock.ts';
import { enableForeignKeys } from '../src/lib/server/db/enable-foreign-keys.ts';
import { media, project, transcript, job } from '../src/lib/server/db/domain.schema.ts';
import * as schema from '../src/lib/server/db/schema.ts';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL is not set');
}

if (!process.env.BETTER_AUTH_SECRET) {
	throw new Error('BETTER_AUTH_SECRET is not set');
}

const E2E_EMAIL = 'e2e@cutline.test';
const E2E_PASSWORD = 'e2e-password-123';
const E2E_NAME = 'Alex Chen';

const client = createClient({ url: databaseUrl });
await enableForeignKeys(client);
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: 'drizzle' });

const auth = betterAuth({
	baseURL: process.env.ORIGIN ?? 'http://localhost:4173',
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true }
});

const existingUser = await db.query.user.findFirst({
	where: (table, { eq }) => eq(table.email, E2E_EMAIL)
});

const userId =
	existingUser?.id ??
	(
		await auth.api.signUpEmail({
			body: {
				email: E2E_EMAIL,
				password: E2E_PASSWORD,
				name: E2E_NAME
			}
		})
	).user.id;

const { words } = buildMockTranscript();

await db
	.insert(project)
	.values([
		{
			id: 'proj-hero',
			userId,
			title: 'How I edit videos 3x faster',
			kind: 'TALKING HEAD',
			description:
				'Talking-head tutorial · 1080p · transcript ready. Pick up where you left off — 8 sentences, 2 filler words flagged.',
			durationSeconds: 272,
			thumb: 'repeating-linear-gradient(135deg,#1c1c20 0 12px,#191920 12px 24px)',
			createdAt: new Date('2026-06-20T00:00:00.000Z'),
			updatedAt: new Date('2026-06-26T12:00:00.000Z')
		},
		{
			id: MOCK_EMPTY_TRANSCRIPT_PROJECT_ID,
			userId,
			title: 'Untitled draft',
			kind: 'DEMO',
			description: null,
			durationSeconds: 0,
			thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
			createdAt: new Date('2026-06-26T10:00:00.000Z'),
			updatedAt: new Date('2026-06-26T11:00:00.000Z')
		},
		{
			id: 'proj-q3-recap',
			userId,
			title: 'Q3 launch recap',
			kind: 'WEBINAR',
			description: null,
			durationSeconds: 438,
			thumb: 'repeating-linear-gradient(135deg,#1f1a2c 0 12px,#191622 12px 24px)',
			createdAt: new Date('2026-06-24T00:00:00.000Z'),
			updatedAt: new Date('2026-06-25T12:00:00.000Z')
		},
		{
			id: 'e2e-upload-ready',
			userId,
			title: 'Uploaded draft',
			kind: 'DEMO',
			description: null,
			durationSeconds: 0,
			thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
			createdAt: new Date('2026-06-26T09:00:00.000Z'),
			updatedAt: new Date('2026-06-26T09:00:00.000Z')
		},
		{
			id: 'e2e-transcribing',
			userId,
			title: 'Transcribing draft',
			kind: 'DEMO',
			description: null,
			durationSeconds: 0,
			thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
			createdAt: new Date('2026-06-26T08:00:00.000Z'),
			updatedAt: new Date('2026-06-26T08:00:00.000Z')
		}
	])
	.onConflictDoNothing();

await db
	.insert(transcript)
	.values([
		{
			id: 'e2e-transcript-hero',
			projectId: 'proj-hero',
			words: JSON.stringify(words),
			captionStyle: 'karaoke'
		},
		{
			id: 'e2e-transcript-upload-ready',
			projectId: 'e2e-upload-ready',
			words: JSON.stringify([]),
			captionStyle: 'karaoke'
		},
		{
			id: 'e2e-transcript-transcribing',
			projectId: 'e2e-transcribing',
			words: JSON.stringify([]),
			captionStyle: 'karaoke'
		}
	])
	.onConflictDoNothing();

await db
	.insert(media)
	.values([
		...mockEditorResources.map((resource) => ({
			id: resource.id,
			projectId: 'proj-hero',
			name: resource.name,
			durationSeconds: resource.dur,
			kind: resource.kind,
			thumb: resource.thumb,
			sizeBytes: 0,
			createdAt: new Date()
		})),
		{
			id: 'e2e-upload-ready-media',
			projectId: 'e2e-upload-ready',
			name: 'clip.mp4',
			durationSeconds: 0,
			kind: 'A-roll',
			thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
			sizeBytes: 1024,
			objectKey: 'e2e/uploads/clip.mp4',
			status: 'ingesting',
			createdAt: new Date()
		},
		{
			id: 'e2e-transcribing-media',
			projectId: 'e2e-transcribing',
			name: 'clip.mp4',
			durationSeconds: 120,
			kind: 'A-roll',
			thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)',
			sizeBytes: 1024,
			objectKey: 'e2e/uploads/transcribing.mp4',
			status: 'ready',
			createdAt: new Date()
		},
		{
			id: 'e2e-q3-media',
			projectId: 'proj-q3-recap',
			name: 'recap.mp4',
			durationSeconds: 438,
			kind: 'A-roll',
			thumb: 'repeating-linear-gradient(135deg,#1f1a2c 0 12px,#191622 12px 24px)',
			sizeBytes: 1024,
			status: 'ready',
			createdAt: new Date()
		}
	])
	.onConflictDoNothing();

await db
	.insert(job)
	.values([
		{
			id: 'e2e-transcription-job',
			type: 'transcription',
			projectId: 'e2e-transcribing',
			status: 'running',
			progress: 0.45,
			payload: JSON.stringify({ projectId: 'e2e-transcribing' }),
			priority: 0,
			maxAttempts: 3,
			runAfter: new Date(),
			createdAt: new Date(),
			updatedAt: new Date()
		}
	])
	.onConflictDoNothing();

client.close();
console.log('[e2e-setup] database migrated and seeded');

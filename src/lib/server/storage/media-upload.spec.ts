import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parseCompleteUploadBody, parseUploadUrlBody } from '$lib/server/storage/media-upload';
import { UPLOAD_MAX_BYTES } from '$lib/types/media-upload';

describe('media-upload parsing', () => {
	it('accepts a valid upload-url body', () => {
		expect(
			parseUploadUrlBody({
				filename: 'clip.mp4',
				contentType: 'video/mp4',
				size: 1024
			})
		).toEqual({
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 1024
		});
	});

	it('rejects oversize uploads with 413', () => {
		const result = parseUploadUrlBody({
			filename: 'big.mp4',
			contentType: 'video/mp4',
			size: UPLOAD_MAX_BYTES + 1
		});
		expect(result).toMatchObject({ ok: false, status: 413 });
	});

	it('rejects unsupported MIME types with 415', () => {
		const result = parseUploadUrlBody({
			filename: 'clip.avi',
			contentType: 'video/x-msvideo',
			size: 100
		});
		expect(result).toMatchObject({ ok: false, status: 415 });
	});

	it('parses multipart complete bodies', () => {
		expect(
			parseCompleteUploadBody({
				multipart: {
					uploadId: 'upload-1',
					parts: [{ partNumber: 1, etag: '"abc"' }]
				}
			})
		).toEqual({
			multipart: {
				uploadId: 'upload-1',
				parts: [{ partNumber: 1, etag: '"abc"' }]
			}
		});
	});

	it('allows empty complete bodies for single PUT uploads', () => {
		expect(parseCompleteUploadBody(null)).toEqual({});
	});
});

describe('createMediaUploadUrl', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('creates a media row and single PUT presign for small files', async () => {
		vi.doMock('$lib/server/storage/r2', () => ({
			presignPutObject: vi.fn().mockResolvedValue('https://r2.example/put'),
			createMultipartUpload: vi.fn(),
			presignUploadPart: vi.fn(),
			completeMultipartUpload: vi.fn()
		}));

		const { createMediaUploadUrl } = await import('$lib/server/storage/media-upload');
		const { createTestDb } = await import('$lib/test/test-db');
		const { project, transcript } = await import('$lib/server/db/domain.schema');
		const { user: authUserTable } = await import('$lib/server/db/auth.schema');

		const { db } = await createTestDb();
		await db.insert(authUserTable).values({
			id: 'user-a',
			name: 'Alex',
			email: 'alex@cutline.test',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await db.insert(project).values({
			id: 'proj-1',
			userId: 'user-a',
			title: 'Demo',
			kind: 'TALKING HEAD',
			description: null,
			durationSeconds: 0,
			thumb: 'thumb'
		});
		await db.insert(transcript).values({ projectId: 'proj-1', words: '[]' });

		const result = await createMediaUploadUrl(db, 'user-a', 'proj-1', {
			filename: 'clip.mp4',
			contentType: 'video/mp4',
			size: 4096
		});

		expect(result).toMatchObject({
			upload: {
				mode: 'single',
				url: 'https://r2.example/put'
			}
		});
		expect(String((result as { upload: { objectKey: string } }).upload.objectKey)).toMatch(
			/^users\/user-a\/projects\/proj-1\/media\/[0-9a-f-]+\/source\.mp4$/
		);
	});
});

describe('completeMediaUpload', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('marks media uploaded and enqueues an ingest job', async () => {
		vi.doMock('$lib/server/storage/r2', () => ({
			completeMultipartUpload: vi.fn()
		}));

		const { completeMediaUpload } = await import('$lib/server/storage/media-upload');
		const { createTestDb } = await import('$lib/test/test-db');
		const { media, project, transcript } = await import('$lib/server/db/domain.schema');
		const { user: authUserTable } = await import('$lib/server/db/auth.schema');
		const { job } = await import('$lib/server/db/domain.schema');
		const { eq } = await import('drizzle-orm');

		const { db } = await createTestDb();
		await db.insert(authUserTable).values({
			id: 'user-a',
			name: 'Alex',
			email: 'alex@cutline.test',
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await db.insert(project).values({
			id: 'proj-1',
			userId: 'user-a',
			title: 'Demo',
			kind: 'TALKING HEAD',
			description: null,
			durationSeconds: 0,
			thumb: 'thumb'
		});
		await db.insert(transcript).values({ projectId: 'proj-1', words: '[]' });
		await db.insert(media).values({
			id: 'media-1',
			projectId: 'proj-1',
			name: 'clip.mp4',
			durationSeconds: 0,
			kind: 'B-roll',
			thumb: 'thumb',
			sizeBytes: 100,
			objectKey: 'users/user-a/projects/proj-1/media/media-1/source.mp4',
			contentType: 'video/mp4',
			status: 'uploading'
		});

		const result = await completeMediaUpload(db, 'user-a', 'proj-1', 'media-1', {});
		expect(result).toMatchObject({ ok: true });

		const [row] = await db.select().from(media).where(eq(media.id, 'media-1'));
		expect(row?.status).toBe('ingesting');

		const jobs = await db.select().from(job);
		expect(jobs).toHaveLength(1);
		expect(jobs[0]?.type).toBe('ingest');
	});
});

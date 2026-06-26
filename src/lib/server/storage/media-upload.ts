import { and, eq } from 'drizzle-orm';
import { media } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { enqueueJob } from '$lib/server/jobs/job-store';
import { assertProjectOwned } from '$lib/server/project-access';
import type { ServerError, ServerResult } from '$lib/server/result';
import {
	buildMediaObjectKey,
	resolveUploadContentType,
	sanitizeUploadFilename
} from '$lib/server/storage/object-key';
import {
	completeMultipartUpload,
	createMultipartUpload,
	presignPutObject,
	presignUploadPart
} from '$lib/server/storage/r2';
import { DEFAULT_RECORD_THUMB } from '$lib/types/media';
import type {
	CompleteUploadBody,
	IngestJobPayload,
	UploadContentType,
	UploadUrlRequest,
	UploadUrlResponse
} from '$lib/types/media-upload';
import {
	UPLOAD_MAX_BYTES,
	UPLOAD_MULTIPART_THRESHOLD_BYTES,
	UPLOAD_PART_SIZE_BYTES
} from '$lib/types/media-upload';

function multipartPartCount(sizeBytes: number): number {
	return Math.ceil(sizeBytes / UPLOAD_PART_SIZE_BYTES);
}

export function parseUploadUrlBody(raw: unknown): UploadUrlRequest | ServerError {
	if (typeof raw !== 'object' || raw === null) {
		return { ok: false, status: 400, message: 'Invalid request body' };
	}

	const body = raw as Record<string, unknown>;
	const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
	const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : '';
	const size = typeof body.size === 'number' ? body.size : Number.NaN;

	if (!filename) {
		return { ok: false, status: 400, message: 'filename is required' };
	}
	if (!Number.isFinite(size) || size <= 0) {
		return { ok: false, status: 400, message: 'size must be a positive number' };
	}
	if (size > UPLOAD_MAX_BYTES) {
		return { ok: false, status: 413, message: 'File exceeds the 5 GB upload limit' };
	}

	const resolvedType = resolveUploadContentType(filename, contentType);
	if (!resolvedType) {
		return { ok: false, status: 415, message: 'Unsupported content type' };
	}

	return { filename, contentType: resolvedType, size };
}

export function parseCompleteUploadBody(raw: unknown): CompleteUploadBody | ServerError {
	if (raw == null) {
		return {};
	}
	if (typeof raw !== 'object') {
		return { ok: false, status: 400, message: 'Invalid request body' };
	}

	const body = raw as Record<string, unknown>;
	if (!('multipart' in body)) {
		return {};
	}

	const multipart = body.multipart;
	if (typeof multipart !== 'object' || multipart === null) {
		return { ok: false, status: 400, message: 'Invalid multipart payload' };
	}

	const uploadId =
		typeof (multipart as { uploadId?: unknown }).uploadId === 'string'
			? (multipart as { uploadId: string }).uploadId
			: '';
	const partsRaw = (multipart as { parts?: unknown }).parts;

	if (!uploadId) {
		return { ok: false, status: 400, message: 'multipart.uploadId is required' };
	}
	if (!Array.isArray(partsRaw) || partsRaw.length === 0) {
		return { ok: false, status: 400, message: 'multipart.parts is required' };
	}

	const parts = partsRaw.map((part) => {
		if (typeof part !== 'object' || part === null) {
			return null;
		}
		const partNumber = (part as { partNumber?: unknown }).partNumber;
		const etag = (part as { etag?: unknown }).etag;
		if (typeof partNumber !== 'number' || !Number.isInteger(partNumber) || partNumber < 1) {
			return null;
		}
		if (typeof etag !== 'string' || !etag.trim()) {
			return null;
		}
		return { partNumber, etag: etag.trim() };
	});

	if (parts.some((part) => part === null)) {
		return { ok: false, status: 400, message: 'Invalid multipart part entry' };
	}

	return {
		multipart: {
			uploadId,
			parts: parts as { partNumber: number; etag: string }[]
		}
	};
}

export async function createMediaUploadUrl(
	database: Database,
	userId: string,
	projectId: string,
	input: UploadUrlRequest
): Promise<UploadUrlResponse | ServerError> {
	const ownerError = await assertProjectOwned(database, userId, projectId);
	if (ownerError) return ownerError;

	const mediaId = crypto.randomUUID();
	const objectKey = buildMediaObjectKey(
		userId,
		projectId,
		mediaId,
		input.contentType as UploadContentType,
		input.filename
	);
	const displayName = sanitizeUploadFilename(input.filename);
	const now = new Date();

	await database.insert(media).values({
		id: mediaId,
		projectId,
		name: displayName,
		durationSeconds: 0,
		kind: 'B-roll',
		thumb: DEFAULT_RECORD_THUMB,
		sizeBytes: input.size,
		objectKey,
		contentType: input.contentType,
		status: 'uploading',
		createdAt: now
	});

	if (input.size <= UPLOAD_MULTIPART_THRESHOLD_BYTES) {
		const url = await presignPutObject(objectKey, input.contentType);
		return {
			mediaId,
			upload: { mode: 'single', url, objectKey }
		};
	}

	const uploadId = await createMultipartUpload(objectKey, input.contentType);
	const partCount = multipartPartCount(input.size);
	const parts = await Promise.all(
		Array.from({ length: partCount }, async (_, index) => ({
			partNumber: index + 1,
			url: await presignUploadPart(objectKey, uploadId, index + 1)
		}))
	);

	return {
		mediaId,
		upload: {
			mode: 'multipart',
			uploadId,
			objectKey,
			parts,
			partSize: UPLOAD_PART_SIZE_BYTES
		}
	};
}

export async function completeMediaUpload(
	database: Database,
	userId: string,
	projectId: string,
	mediaId: string,
	body: CompleteUploadBody
): Promise<ServerResult & { jobId?: string }> {
	const ownerError = await assertProjectOwned(database, userId, projectId);
	if (ownerError) return ownerError;

	const [row] = await database
		.select()
		.from(media)
		.where(and(eq(media.id, mediaId), eq(media.projectId, projectId)))
		.limit(1);

	if (!row) {
		return { ok: false, status: 404, message: 'Media not found' };
	}
	if (!row.objectKey) {
		return { ok: false, status: 400, message: 'Media is not uploadable' };
	}
	if (row.status !== 'uploading' && row.status !== 'pending') {
		return { ok: false, status: 400, message: 'Upload already completed' };
	}

	if (body.multipart) {
		await completeMultipartUpload(row.objectKey, body.multipart.uploadId, body.multipart.parts);
	}

	await database.update(media).set({ status: 'uploaded' }).where(eq(media.id, mediaId));

	const payload: IngestJobPayload = { mediaId };
	const { id: jobId } = await enqueueJob(database, {
		type: 'ingest',
		projectId,
		payload
	});

	await database.update(media).set({ status: 'ingesting' }).where(eq(media.id, mediaId));

	return { ok: true, jobId };
}

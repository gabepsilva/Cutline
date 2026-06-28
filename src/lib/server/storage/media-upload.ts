import { and, eq, inArray } from 'drizzle-orm';
import { media, project, transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import { enqueueJob } from '$lib/server/jobs/job-store';
import { assertProjectOwned } from '$lib/server/project-access';
import { normalizeProjectTitle } from '$lib/server/project-mutations';
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
import { DEFAULT_AUDIO_THUMB, DEFAULT_RECORD_THUMB } from '$lib/types/media';
import { projectThumb } from '$lib/types/project';
import type {
	CompleteUploadBody,
	InitUploadUrlRequest,
	InitUploadUrlResponse,
	UploadContentType,
	UploadTargetResponse,
	UploadUrlRequest,
	UploadUrlResponse
} from '$lib/types/media-upload';
import type { IngestJobPayload } from '$lib/types/job';
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

export function parseInitUploadUrlBody(raw: unknown): InitUploadUrlRequest | ServerError {
	const parsed = parseUploadUrlBody(raw);
	if ('ok' in parsed && parsed.ok === false) return parsed;

	if (typeof raw !== 'object' || raw === null) {
		return { ok: false, status: 400, message: 'Invalid request body' };
	}

	const title =
		typeof (raw as { title?: unknown }).title === 'string' ? (raw as { title: string }).title : '';

	return { ...(parsed as UploadUrlRequest), title };
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

async function presignUploadTarget(
	objectKey: string,
	contentType: string,
	size: number
): Promise<UploadTargetResponse> {
	if (size <= UPLOAD_MULTIPART_THRESHOLD_BYTES) {
		const url = await presignPutObject(objectKey, contentType);
		return { mode: 'single', url, objectKey };
	}

	const uploadId = await createMultipartUpload(objectKey, contentType);
	const partCount = multipartPartCount(size);
	const parts = await Promise.all(
		Array.from({ length: partCount }, async (_, index) => ({
			partNumber: index + 1,
			url: await presignUploadPart(objectKey, uploadId, index + 1)
		}))
	);

	return {
		mode: 'multipart',
		uploadId,
		objectKey,
		parts,
		partSize: UPLOAD_PART_SIZE_BYTES
	};
}

function thumbForUpload(contentType: string): string {
	return contentType.startsWith('audio/') ? DEFAULT_AUDIO_THUMB : DEFAULT_RECORD_THUMB;
}

/** Builds the first-upload `media` row (status `uploading`) shared by both create paths. */
function buildMediaUploadRow(projectId: string, input: UploadUrlRequest, userId: string) {
	const mediaId = crypto.randomUUID();
	const objectKey = buildMediaObjectKey(
		userId,
		projectId,
		mediaId,
		input.contentType as UploadContentType,
		input.filename
	);
	const displayName = sanitizeUploadFilename(input.filename);
	const values: typeof media.$inferInsert = {
		id: mediaId,
		projectId,
		name: displayName,
		durationSeconds: 0,
		kind: 'B-roll',
		thumb: thumbForUpload(input.contentType),
		sizeBytes: input.size,
		objectKey,
		contentType: input.contentType,
		status: 'uploading',
		createdAt: new Date()
	};

	return { mediaId, objectKey, displayName, values };
}

async function insertMediaUploadRow(
	database: Database,
	projectId: string,
	input: UploadUrlRequest,
	userId: string
): Promise<{ mediaId: string; objectKey: string; displayName: string }> {
	const { mediaId, objectKey, displayName, values } = buildMediaUploadRow(projectId, input, userId);
	await database.insert(media).values(values);
	return { mediaId, objectKey, displayName };
}

/**
 * Creates a draft project + transcript + first media row, then presigns R2 upload.
 * Cancel/abort on the client keeps the draft project and in-progress media rows —
 * no server cleanup until the user deletes the project or a future cleanup job runs.
 */
export async function initProjectMediaUpload(
	database: Database,
	userId: string,
	input: InitUploadUrlRequest
): Promise<InitUploadUrlResponse | ServerError> {
	const titleCheck = normalizeProjectTitle(input.title);
	if (!titleCheck.ok) return titleCheck;

	const title = input.title.trim();
	const kind = 'TALKING HEAD';
	const projectId = crypto.randomUUID();
	const mediaRow = buildMediaUploadRow(projectId, input, userId);

	await database.batch([
		database.insert(project).values({
			id: projectId,
			userId,
			title,
			kind,
			description: null,
			durationSeconds: 0,
			thumb: projectThumb(kind)
		}),
		database.insert(transcript).values({
			projectId,
			words: '[]'
		}),
		database.insert(media).values(mediaRow.values)
	]);

	const upload = await presignUploadTarget(mediaRow.objectKey, input.contentType, input.size);

	return {
		projectId,
		mediaId: mediaRow.mediaId,
		contentType: input.contentType,
		upload
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

	const { mediaId, objectKey } = await insertMediaUploadRow(database, projectId, input, userId);
	const upload = await presignUploadTarget(objectKey, input.contentType, input.size);

	return {
		mediaId,
		contentType: input.contentType,
		upload
	};
}

export async function completeMediaUpload(
	database: Database,
	userId: string,
	projectId: string,
	mediaId: string,
	body: CompleteUploadBody,
	causationId: string
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

	const [updated] = await database
		.update(media)
		.set({ status: 'uploaded' })
		.where(
			and(
				eq(media.id, mediaId),
				eq(media.projectId, projectId),
				inArray(media.status, ['uploading', 'pending'])
			)
		)
		.returning({ id: media.id });

	if (!updated) {
		return { ok: false, status: 400, message: 'Upload already completed' };
	}

	const payload: IngestJobPayload = { mediaId, actorId: userId, causationId };
	const { id: jobId } = await enqueueJob(database, {
		type: 'ingest',
		projectId,
		payload
	});

	await database.update(media).set({ status: 'ingesting' }).where(eq(media.id, mediaId));

	return { ok: true, jobId };
}

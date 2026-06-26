/** Allowed source video MIME types for direct R2 upload (M8-01). */
export const UPLOAD_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export type UploadContentType = (typeof UPLOAD_CONTENT_TYPES)[number];

export const MEDIA_STATUSES = [
	'pending',
	'uploading',
	'uploaded',
	'ingesting',
	'ready',
	'failed'
] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

/** Max single-file upload size — 5 GiB. */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024 * 1024;

/** Files above this size use S3 multipart upload. */
export const UPLOAD_MULTIPART_THRESHOLD_BYTES = 100 * 1024 * 1024;

/** Multipart part size — 8 MiB. */
export const UPLOAD_PART_SIZE_BYTES = 8 * 1024 * 1024;

export interface IngestJobPayload {
	mediaId: string;
}

export interface UploadUrlRequest {
	filename: string;
	contentType: string;
	size: number;
}

export interface MultipartPartUpload {
	partNumber: number;
	url: string;
}

export interface SingleUploadResponse {
	mode: 'single';
	url: string;
	objectKey: string;
}

export interface MultipartUploadResponse {
	mode: 'multipart';
	uploadId: string;
	objectKey: string;
	parts: MultipartPartUpload[];
	partSize: number;
}

export type UploadTargetResponse = SingleUploadResponse | MultipartUploadResponse;

export interface UploadUrlResponse {
	mediaId: string;
	upload: UploadTargetResponse;
}

export interface MultipartCompletePart {
	partNumber: number;
	etag: string;
}

export interface CompleteUploadBody {
	multipart?: {
		uploadId: string;
		parts: MultipartCompletePart[];
	};
}

import type { UploadContentType } from '$lib/types/media-upload';
import { UPLOAD_CONTENT_TYPES } from '$lib/types/media-upload';

const EXTENSION_BY_CONTENT_TYPE: Record<UploadContentType, string> = {
	'video/mp4': 'mp4',
	'video/quicktime': 'mov',
	'video/webm': 'webm'
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, UploadContentType> = {
	mp4: 'video/mp4',
	mov: 'video/quicktime',
	qt: 'video/quicktime',
	webm: 'video/webm'
};

export function isUploadContentType(value: string): value is UploadContentType {
	return (UPLOAD_CONTENT_TYPES as readonly string[]).includes(value);
}

export function extensionForContentType(contentType: UploadContentType): string {
	return EXTENSION_BY_CONTENT_TYPE[contentType];
}

export function extensionFromFilename(filename: string): string | null {
	const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
	return match ? match[1].toLowerCase() : null;
}

export function resolveUploadContentType(
	filename: string,
	contentType: string
): UploadContentType | null {
	if (isUploadContentType(contentType)) {
		return contentType;
	}

	const ext = extensionFromFilename(filename);
	if (!ext) return null;
	return CONTENT_TYPE_BY_EXTENSION[ext] ?? null;
}

export function buildMediaObjectKey(
	userId: string,
	projectId: string,
	mediaId: string,
	contentType: UploadContentType,
	filename: string
): string {
	const ext = extensionForContentType(contentType) ?? extensionFromFilename(filename) ?? 'mp4';
	return `users/${userId}/projects/${projectId}/media/${mediaId}/source.${ext}`;
}

export function buildProjectMediaPrefix(userId: string, projectId: string): string {
	return `users/${userId}/projects/${projectId}/media/`;
}

export function buildMediaPrefix(userId: string, projectId: string, mediaId: string): string {
	return `users/${userId}/projects/${projectId}/media/${mediaId}/`;
}

export function sanitizeUploadFilename(filename: string): string {
	const base = filename.trim().split(/[/\\]/).pop() ?? 'upload';
	const cleaned = base.replace(/[^\w.\-() ]+/g, '_').slice(0, 120);
	return cleaned || 'upload';
}

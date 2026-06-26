import { describe, expect, it } from 'vitest';
import {
	buildMediaObjectKey,
	buildMediaPrefix,
	buildProjectMediaPrefix,
	extensionFromFilename,
	resolveUploadContentType,
	sanitizeUploadFilename
} from '$lib/server/storage/object-key';

describe('object-key', () => {
	it('builds the canonical media object key', () => {
		expect(buildMediaObjectKey('user-1', 'proj-1', 'media-1', 'video/mp4', 'clip.mp4')).toBe(
			'users/user-1/projects/proj-1/media/media-1/source.mp4'
		);
	});

	it('resolves content type from filename when MIME is generic', () => {
		expect(resolveUploadContentType('take.mov', 'application/octet-stream')).toBe(
			'video/quicktime'
		);
	});

	it('rejects unsupported uploads', () => {
		expect(resolveUploadContentType('notes.txt', 'text/plain')).toBeNull();
	});

	it('sanitizes filenames for display', () => {
		expect(sanitizeUploadFilename('../../wild/name!.mp4')).toBe('name_.mp4');
	});

	it('builds cleanup prefixes', () => {
		expect(buildProjectMediaPrefix('u', 'p')).toBe('users/u/projects/p/media/');
		expect(buildMediaPrefix('u', 'p', 'm')).toBe('users/u/projects/p/media/m/');
	});

	it('reads extensions from filenames', () => {
		expect(extensionFromFilename('clip.WEBM')).toBe('webm');
	});
});

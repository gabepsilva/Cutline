import type { EditorState } from '$lib/editor/editor-state.svelte';
import { DEFAULT_RECORD_THUMB } from '$lib/types/media';
import type {
	MultipartUploadResponse,
	SingleUploadResponse,
	UploadUrlResponse
} from '$lib/types/media-upload';
import { UPLOAD_PART_SIZE_BYTES } from '$lib/types/media-upload';

async function readJson<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const message = await response.text().catch(() => '');
		throw new Error(message || `Request failed with status ${response.status}`);
	}
	return (await response.json()) as T;
}

function putWithProgress(
	url: string,
	body: Blob,
	contentType: string,
	onProgress?: (loaded: number, total: number) => void
): Promise<string | undefined> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open('PUT', url);
		xhr.setRequestHeader('Content-Type', contentType);

		if (onProgress) {
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					onProgress(event.loaded, event.total);
				}
			};
		}

		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve(xhr.getResponseHeader('ETag') ?? undefined);
				return;
			}
			reject(new Error(`Upload failed with status ${xhr.status}`));
		};

		xhr.onerror = () => reject(new Error('Upload failed'));
		xhr.send(body);
	});
}

async function uploadSingle(
	target: SingleUploadResponse,
	file: File,
	contentType: string,
	onProgress?: (ratio: number) => void
): Promise<void> {
	await putWithProgress(
		target.url,
		file,
		contentType,
		onProgress
			? (loaded, total) => {
					onProgress(total > 0 ? loaded / total : 0);
				}
			: undefined
	);
}

async function uploadMultipart(
	target: MultipartUploadResponse,
	file: File,
	contentType: string,
	onProgress?: (ratio: number) => void
): Promise<{ uploadId: string; parts: { partNumber: number; etag: string }[] }> {
	const parts: { partNumber: number; etag: string }[] = [];
	let uploadedBytes = 0;

	for (const part of target.parts) {
		const start = (part.partNumber - 1) * target.partSize;
		const end = Math.min(start + target.partSize, file.size);
		const chunk = file.slice(start, end);
		const etag = await putWithProgress(part.url, chunk, contentType);
		if (!etag) {
			throw new Error('Missing ETag from uploaded part');
		}
		parts.push({ partNumber: part.partNumber, etag });
		uploadedBytes += chunk.size;
		onProgress?.(file.size > 0 ? uploadedBytes / file.size : 1);
	}

	return { uploadId: target.uploadId, parts };
}

/** Direct browser → R2 upload for a project media file (M8-01). */
export async function uploadProjectMedia(
	projectId: string,
	file: File,
	onProgress?: (ratio: number) => void
): Promise<{ mediaId: string; jobId: string; name: string }> {
	const presignResponse = await fetch(`/api/projects/${projectId}/media/upload-url`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			filename: file.name,
			contentType: file.type,
			size: file.size
		})
	});

	const presign = await readJson<UploadUrlResponse>(presignResponse);
	let completeBody: Record<string, unknown> = {};

	if (presign.upload.mode === 'single') {
		await uploadSingle(presign.upload, file, presign.contentType, onProgress);
	} else {
		const multipart = await uploadMultipart(presign.upload, file, presign.contentType, onProgress);
		completeBody = { multipart };
	}

	onProgress?.(1);

	const completeResponse = await fetch(
		`/api/projects/${projectId}/media/${presign.mediaId}/complete`,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(completeBody)
		}
	);

	const { jobId } = await readJson<{ jobId: string }>(completeResponse);

	return {
		mediaId: presign.mediaId,
		jobId,
		name: file.name
	};
}

/** Uploads a file and appends an optimistic shelf entry on the editor. */
export async function uploadMediaForEditor(
	editor: EditorState,
	projectId: string,
	file: File,
	onProgress?: (ratio: number) => void
): Promise<{ mediaId: string }> {
	const result = await uploadProjectMedia(projectId, file, onProgress);
	editor.addUploadedResource({
		id: result.mediaId,
		name: result.name,
		dur: 0,
		kind: 'B-roll',
		thumb: DEFAULT_RECORD_THUMB,
		status: 'ingesting'
	});
	return { mediaId: result.mediaId };
}

export { UPLOAD_PART_SIZE_BYTES };

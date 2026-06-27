import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
	uploadImportMedia,
	uploadMediaForEditor,
	uploadProjectMedia
} from '$lib/editor/media-upload';

class MockXMLHttpRequest {
	static instances: MockXMLHttpRequest[] = [];
	status = 200;
	upload = {
		onprogress: null as ((event: ProgressEvent) => void) | null
	};
	onload: (() => void) | null = null;
	onerror: (() => void) | null = null;

	open = vi.fn();
	setRequestHeader = vi.fn();
	send = vi.fn((body: Blob) => {
		this.upload.onprogress?.({
			lengthComputable: true,
			loaded: body.size,
			total: body.size
		} as ProgressEvent);
		queueMicrotask(() => this.onload?.());
	});
	getResponseHeader = vi.fn().mockReturnValue('"etag-1"');

	constructor() {
		MockXMLHttpRequest.instances.push(this);
	}
}

describe('uploadProjectMedia', () => {
	beforeEach(() => {
		MockXMLHttpRequest.instances = [];
		vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('uploads a small file via presigned PUT and completes', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/upload-url')) {
				return new Response(
					JSON.stringify({
						mediaId: 'media-1',
						contentType: 'video/mp4',
						upload: {
							mode: 'single',
							url: 'https://r2.example/put',
							objectKey: 'users/u/projects/p/media/media-1/source.mp4'
						}
					}),
					{ status: 200 }
				);
			}
			if (url.endsWith('/complete')) {
				expect(init?.method).toBe('POST');
				return new Response(JSON.stringify({ jobId: 'job-1' }), { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const file = new File([new Uint8Array([1, 2, 3])], 'clip.mp4', { type: 'video/mp4' });
		const progress: number[] = [];

		const result = await uploadProjectMedia('proj-1', file, (ratio) => progress.push(ratio));

		expect(result).toEqual({ mediaId: 'media-1', jobId: 'job-1', name: 'clip.mp4' });
		expect(MockXMLHttpRequest.instances).toHaveLength(1);
		expect(MockXMLHttpRequest.instances[0]?.setRequestHeader).toHaveBeenCalledWith(
			'Content-Type',
			'video/mp4'
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(progress.at(-1)).toBe(1);
	});

	it('uploads large files with multipart complete payload', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/upload-url')) {
				return new Response(
					JSON.stringify({
						mediaId: 'media-2',
						contentType: 'video/mp4',
						upload: {
							mode: 'multipart',
							uploadId: 'upload-1',
							objectKey: 'key',
							partSize: 8,
							parts: [
								{ partNumber: 1, url: 'https://r2.example/part/1' },
								{ partNumber: 2, url: 'https://r2.example/part/2' }
							]
						}
					}),
					{ status: 200 }
				);
			}
			if (url.endsWith('/complete')) {
				const body = JSON.parse(String(init?.body));
				expect(body.multipart.uploadId).toBe('upload-1');
				expect(body.multipart.parts).toHaveLength(2);
				return new Response(JSON.stringify({ jobId: 'job-2' }), { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const file = new File([new Uint8Array(20)], 'large.mp4', { type: 'video/mp4' });
		Object.defineProperty(file, 'size', { value: 20 });

		const result = await uploadProjectMedia('proj-1', file);
		expect(result.jobId).toBe('job-2');
		expect(MockXMLHttpRequest.instances).toHaveLength(2);
	});

	it('uses resolved content type for PUT even when file.type differs', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/upload-url')) {
				return new Response(
					JSON.stringify({
						mediaId: 'media-3',
						contentType: 'video/quicktime',
						upload: {
							mode: 'single',
							url: 'https://r2.example/put',
							objectKey: 'key'
						}
					}),
					{ status: 200 }
				);
			}
			if (url.endsWith('/complete')) {
				return new Response(JSON.stringify({ jobId: 'job-3' }), { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const file = new File([new Uint8Array([1])], 'take.mov', { type: 'application/octet-stream' });
		await uploadProjectMedia('proj-1', file);

		expect(MockXMLHttpRequest.instances[0]?.setRequestHeader).toHaveBeenCalledWith(
			'Content-Type',
			'video/quicktime'
		);
	});
});

describe('uploadImportMedia', () => {
	beforeEach(() => {
		MockXMLHttpRequest.instances = [];
		vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest as unknown as typeof XMLHttpRequest);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('creates a project on the first upload and completes the file', async () => {
		const onProjectCreated = vi.fn();
		const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url === '/api/projects/media/upload-url') {
				return new Response(
					JSON.stringify({
						projectId: 'proj-new',
						mediaId: 'media-1',
						contentType: 'video/mp4',
						upload: { mode: 'single', url: 'https://r2.example/put', objectKey: 'key' }
					}),
					{ status: 200 }
				);
			}
			if (url.endsWith('/complete')) {
				return new Response(JSON.stringify({ jobId: 'job-1' }), { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const file = new File([new Uint8Array([1])], 'clip.mp4', { type: 'video/mp4' });
		const result = await uploadImportMedia({
			projectId: null,
			projectTitle: 'Launch reel',
			file,
			onProjectCreated
		});

		expect(result).toEqual({
			projectId: 'proj-new',
			mediaId: 'media-1',
			jobId: 'job-1',
			name: 'clip.mp4'
		});
		expect(onProjectCreated).toHaveBeenCalledWith('proj-new');
		expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/projects/media/upload-url');
	});

	it('reuses an existing project id for subsequent uploads', async () => {
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/upload-url')) {
				return new Response(
					JSON.stringify({
						mediaId: 'media-2',
						contentType: 'video/mp4',
						upload: { mode: 'single', url: 'https://r2.example/put', objectKey: 'key' }
					}),
					{ status: 200 }
				);
			}
			if (url.endsWith('/complete')) {
				return new Response(JSON.stringify({ jobId: 'job-2' }), { status: 200 });
			}
			throw new Error(`Unexpected fetch: ${url}`);
		});
		vi.stubGlobal('fetch', fetchMock);

		const file = new File([new Uint8Array([1])], 'b-roll.mp4', { type: 'video/mp4' });
		const result = await uploadImportMedia({
			projectId: 'proj-existing',
			projectTitle: 'Launch reel',
			file
		});

		expect(result.projectId).toBe('proj-existing');
		expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
			'/api/projects/proj-existing/media/upload-url'
		);
	});
});

describe('uploadMediaForEditor', () => {
	it('appends an optimistic ingesting resource', async () => {
		const editor = {
			addUploadedResource: vi.fn()
		};

		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/upload-url')) {
				return new Response(
					JSON.stringify({
						mediaId: 'media-9',
						contentType: 'video/mp4',
						upload: { mode: 'single', url: 'https://r2/put', objectKey: 'key' }
					}),
					{ status: 200 }
				);
			}
			return new Response(JSON.stringify({ jobId: 'job-9' }), { status: 200 });
		});
		vi.stubGlobal('fetch', fetchMock);

		class SinglePartXHR extends MockXMLHttpRequest {
			send = vi.fn(() => {
				queueMicrotask(() => this.onload?.());
			});
		}
		vi.stubGlobal('XMLHttpRequest', SinglePartXHR as unknown as typeof XMLHttpRequest);

		const file = new File([new Uint8Array([1])], 'clip.mp4', { type: 'video/mp4' });
		const result = await uploadMediaForEditor(editor as never, 'proj-1', file);

		expect(result).toEqual({ mediaId: 'media-9' });
		expect(editor.addUploadedResource).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'media-9', status: 'ingesting' })
		);
	});
});

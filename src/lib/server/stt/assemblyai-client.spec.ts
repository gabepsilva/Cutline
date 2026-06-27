import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	assemblyAiProgress,
	pollAssemblyAiTranscript,
	readAssemblyAiApiKey,
	submitAssemblyAiTranscript
} from '$lib/server/stt/assemblyai-client';

describe('assemblyai-client', () => {
	const originalKey = process.env.ASSEMBLYAI_API_KEY;

	beforeEach(() => {
		process.env.ASSEMBLYAI_API_KEY = 'test-key';
	});

	afterEach(() => {
		process.env.ASSEMBLYAI_API_KEY = originalKey;
		vi.restoreAllMocks();
	});

	it('requires ASSEMBLYAI_API_KEY', () => {
		delete process.env.ASSEMBLYAI_API_KEY;
		expect(() => readAssemblyAiApiKey()).toThrow('ASSEMBLYAI_API_KEY is not configured');
	});

	it('maps transcript status to progress bands', () => {
		expect(assemblyAiProgress('queued')).toBe(0.15);
		expect(assemblyAiProgress('processing')).toBe(0.65);
		expect(assemblyAiProgress('completed')).toBe(1);
	});

	it('submits a transcript job', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ id: 'aa-1' }), { status: 200 }));

		const id = await submitAssemblyAiTranscript(
			'https://audio.example/clip.mp4',
			'test-key',
			fetchMock
		);

		expect(id).toBe('aa-1');
		expect(fetchMock).toHaveBeenCalledWith(
			'https://api.assemblyai.com/v2/transcript',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('polls until AssemblyAI completes', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ id: 'aa-1', status: 'processing' }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						id: 'aa-1',
						status: 'completed',
						words: [{ text: 'Hi', start: 0, end: 200, confidence: 1 }]
					}),
					{ status: 200 }
				)
			);

		const onProgress = vi.fn();
		const result = await pollAssemblyAiTranscript(
			'aa-1',
			'test-key',
			onProgress,
			async () => false,
			{
				pollIntervalMs: 1,
				fetchFn: fetchMock
			}
		);

		expect(result.status).toBe('completed');
		expect(onProgress).toHaveBeenCalled();
	});
});

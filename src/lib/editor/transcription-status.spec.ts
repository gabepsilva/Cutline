import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	pollMockTranscription,
	pollTranscriptionJob,
	resolveTranscriptUiStatus,
	shouldUseMockTranscription,
	toTranscriptionUiState
} from '$lib/editor/transcription-status';
import { formatTranscriptionPercent, transcriptionStage } from '$lib/types/transcript-ui';

describe('transcript-ui helpers', () => {
	it('formats transcription percent', () => {
		expect(formatTranscriptionPercent(0.456)).toBe('46%');
		expect(formatTranscriptionPercent(1.2)).toBe('100%');
	});

	it('returns stage labels by progress band', () => {
		expect(transcriptionStage(0.1)).toBe('Detecting speech…');
		expect(transcriptionStage(0.5)).toBe('Generating transcript…');
		expect(transcriptionStage(0.9)).toBe('Aligning words to timeline…');
	});
});

describe('transcription-status', () => {
	it('returns ready when words exist', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 3,
				aRoll: null,
				jobStatus: null,
				mockActive: false
			})
		).toBe('ready');
	});

	it('returns transcribing for active jobs or mock', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null },
				jobStatus: { status: 'running', progress: 0.4 },
				mockActive: false
			})
		).toBe('transcribing');

		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: null,
				jobStatus: null,
				mockActive: true
			})
		).toBe('transcribing');
	});

	it('returns unavailable when no A-roll path exists', () => {
		expect(
			resolveTranscriptUiStatus({
				wordCount: 0,
				aRoll: null,
				jobStatus: { status: 'failed', progress: 0 },
				mockActive: false
			})
		).toBe('unavailable');
	});

	it('shouldUseMockTranscription only when no job and uploaded A-roll', () => {
		expect(
			shouldUseMockTranscription({
				wordCount: 0,
				transcriptionJobId: 'job-1',
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null }
			})
		).toBe(false);

		expect(
			shouldUseMockTranscription({
				wordCount: 0,
				transcriptionJobId: null,
				aRoll: { mediaId: 'm1', status: 'ready', videoUrl: null }
			})
		).toBe(true);
	});

	it('maps ui state with stage text', () => {
		expect(toTranscriptionUiState('transcribing', 0.5)).toEqual({
			status: 'transcribing',
			progress: 0.5,
			stage: 'Generating transcript…'
		});
	});
});

describe('pollTranscriptionJob', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('polls until the job reaches a terminal status', async () => {
		const onUpdate = vi.fn();
		const onTerminal = vi.fn();
		const fetchMock = vi
			.fn()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ status: 'running', progress: 0.4 }), { status: 200 })
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ status: 'succeeded', progress: 1 }), { status: 200 })
			);
		vi.stubGlobal('fetch', fetchMock);

		pollTranscriptionJob('job-1', onUpdate, onTerminal, 100);

		await vi.advanceTimersByTimeAsync(0);
		expect(onUpdate).toHaveBeenCalledWith({ status: 'running', progress: 0.4 });

		await vi.advanceTimersByTimeAsync(100);
		expect(onTerminal).toHaveBeenCalledWith({ status: 'succeeded', progress: 1 });
	});
});

describe('pollMockTranscription', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('reports progress and persists a mock transcript on completion', async () => {
		const onUpdate = vi.fn();
		const onComplete = vi.fn();
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		vi.stubGlobal('window', { location: { hostname: 'localhost' } });

		pollMockTranscription('proj-mock', onUpdate, onComplete);

		await vi.advanceTimersByTimeAsync(500);
		expect(onUpdate.mock.calls.length).toBeGreaterThan(0);

		await vi.advanceTimersByTimeAsync(500);
		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalledWith(
			'/projects/proj-mock',
			expect.objectContaining({ method: 'PUT' })
		);
		expect(onComplete).toHaveBeenCalledOnce();
	});
});

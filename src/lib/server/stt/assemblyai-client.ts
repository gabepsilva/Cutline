import type {
	AssemblyAiCreateResponse,
	AssemblyAiTranscript,
	AssemblyAiTranscriptStatus
} from '$lib/server/stt/assemblyai-types';

const API_BASE = 'https://api.assemblyai.com/v2';
const TERMINAL: AssemblyAiTranscriptStatus[] = ['completed', 'error'];

export type FetchLike = typeof fetch;

export function readAssemblyAiApiKey(): string {
	const key = process.env.ASSEMBLYAI_API_KEY;
	if (!key) {
		throw new Error('ASSEMBLYAI_API_KEY is not configured');
	}
	return key;
}

async function assemblyAiJson<T>(
	path: string,
	apiKey: string,
	init: RequestInit | undefined,
	fetchFn: FetchLike
): Promise<T> {
	const response = await fetchFn(`${API_BASE}${path}`, {
		...init,
		headers: {
			authorization: apiKey,
			...(init?.headers ?? {})
		}
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`AssemblyAI ${path} failed (${response.status}): ${body}`);
	}

	return (await response.json()) as T;
}

export async function submitAssemblyAiTranscript(
	audioUrl: string,
	apiKey: string,
	fetchFn: FetchLike = fetch
): Promise<string> {
	const data = await assemblyAiJson<AssemblyAiCreateResponse>(
		'/transcript',
		apiKey,
		{
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				audio_url: audioUrl,
				speaker_labels: true,
				punctuate: true,
				format_text: true
			})
		},
		fetchFn
	);

	return data.id;
}

export async function getAssemblyAiTranscript(
	transcriptId: string,
	apiKey: string,
	fetchFn: FetchLike = fetch
): Promise<AssemblyAiTranscript> {
	return assemblyAiJson<AssemblyAiTranscript>(
		`/transcript/${transcriptId}`,
		apiKey,
		undefined,
		fetchFn
	);
}

export function assemblyAiProgress(status: AssemblyAiTranscriptStatus): number {
	if (status === 'completed') return 1;
	if (status === 'processing') return 0.65;
	if (status === 'queued') return 0.15;
	return 0;
}

export function isAssemblyAiTerminal(status: AssemblyAiTranscriptStatus): boolean {
	return TERMINAL.includes(status);
}

export async function pollAssemblyAiTranscript(
	transcriptId: string,
	apiKey: string,
	onProgress: (progress: number) => Promise<void>,
	shouldCancel: () => Promise<boolean>,
	options: { pollIntervalMs?: number; fetchFn?: FetchLike } = {}
): Promise<AssemblyAiTranscript> {
	const pollIntervalMs = options.pollIntervalMs ?? 3_000;
	const fetchFn = options.fetchFn ?? fetch;

	while (true) {
		if (await shouldCancel()) {
			throw new Error('Transcription canceled');
		}

		const transcript = await getAssemblyAiTranscript(transcriptId, apiKey, fetchFn);
		await onProgress(assemblyAiProgress(transcript.status));

		if (transcript.status === 'error') {
			throw new Error(transcript.error ?? 'AssemblyAI transcription failed');
		}

		if (transcript.status === 'completed') {
			return transcript;
		}

		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}
}

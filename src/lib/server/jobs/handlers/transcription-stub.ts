import { eq } from 'drizzle-orm';
import { buildMockTranscript } from '$lib/mocks/editor.mock';
import { deriveSentences } from '$lib/editor/derive-sentences';
import { transcript } from '$lib/server/db/domain.schema';
import type { Database } from '$lib/server/db/types';
import type { TranscriptionJobPayload } from '$lib/types/job';
import {
	JobCanceledError,
	registerJobHandler,
	type JobHandlerContext
} from '$lib/server/jobs/worker';

function parseTranscriptWordCount(raw: string): number {
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.length : 0;
	} catch {
		return 0;
	}
}

function stubStepDelayMs(): number {
	const raw = process.env.TRANSCRIPTION_STUB_STEP_MS;
	if (raw == null || raw === '') return 1_500;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1_500;
}

async function writeStubTranscript(database: Database, projectId: string): Promise<void> {
	const { words } = buildMockTranscript();
	const [row] = await database
		.select({ id: transcript.id, words: transcript.words })
		.from(transcript)
		.where(eq(transcript.projectId, projectId))
		.limit(1);

	if (!row || parseTranscriptWordCount(row.words) > 0) return;

	void deriveSentences(words);
	await database
		.update(transcript)
		.set({ words: JSON.stringify(words) })
		.where(eq(transcript.projectId, projectId));
}

/**
 * Stub transcription handler until M9-01 (#141).
 * TODO(service): Replace with AssemblyAI worker in #141.
 */
export function registerTranscriptionStubHandler(
	database: Database,
	stepDelayMs = stubStepDelayMs()
) {
	registerJobHandler('transcription', async (ctx: JobHandlerContext) => {
		const payload = JSON.parse(ctx.job.payload) as TranscriptionJobPayload;
		const steps = 10;

		for (let step = 1; step <= steps; step++) {
			if (await ctx.isCancelRequested()) {
				throw new JobCanceledError();
			}
			if (stepDelayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, stepDelayMs));
			}
			await ctx.reportProgress(step / steps);
		}

		await writeStubTranscript(database, payload.projectId);
		await ctx.complete({ stub: true, wordCount: buildMockTranscript().words.length });
	});
}

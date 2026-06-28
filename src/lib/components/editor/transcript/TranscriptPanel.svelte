<script lang="ts">
	import { activeWords, buildStartMap } from '$lib/editor/editor-derive';
	import Button from '$lib/components/ui/Button.svelte';
	import TranscriptIdleState from './TranscriptIdleState.svelte';
	import TranscriptSearch from './TranscriptSearch.svelte';
	import TranscriptSelectionBar from './TranscriptSelectionBar.svelte';
	import TranscriptSentence from './TranscriptSentence.svelte';
	import TranscriptSpeaker from './TranscriptSpeaker.svelte';
	import TranscriptTranscribingState from './TranscriptTranscribingState.svelte';
	import TranscriptUnavailableState from './TranscriptUnavailableState.svelte';
	import type { TranscriptPanelProps } from './TranscriptPanel.types';
	import type { TranscriptSpeakerData } from './TranscriptSpeaker.types';

	let {
		sentences,
		speaker,
		speakersByLabel,
		status = 'ready',
		transcriptionProgress = 0,
		transcriptionStage = 'Detecting speech…',
		mediaProcessing = false,
		transcribeDisabled = false,
		transcribePending = false,
		searchQuery = '',
		fillerCount = 0,
		hasSelection = false,
		selectedText = '',
		deleteLabel = 'Delete word',
		currentWordId = null,
		selectedWordId = null,
		showFiller = true,
		sentenceStartTimes,
		onsearch,
		onremovefillers,
		ondelete,
		onsentenceclick,
		onwordclick,
		ontranscribe,
		class: className = ''
	}: TranscriptPanelProps = $props();

	const isReady = $derived(status === 'ready');
	const isIdle = $derived(status === 'idle');
	const isTranscribing = $derived(status === 'transcribing');
	const showTranscribeAction = $derived(isReady || isIdle || status === 'unavailable');
	const transcribeActionClass = $derived(
		isReady
			? 'transcript-panel__transcribe-action'
			: 'transcript-panel__transcribe-action transcript-panel__transcribe-action--primary'
	);

	const startMap = $derived.by(() => {
		const words = sentences.flatMap((sentence) => sentence.words);
		return buildStartMap(activeWords(words));
	});

	function sentenceStartTime(
		sentenceId: string,
		words: (typeof sentences)[number]['words']
	): number {
		if (sentenceStartTimes?.[sentenceId] !== undefined) {
			return sentenceStartTimes[sentenceId];
		}
		const firstActive = words.find((word) => !word.deleted);
		return firstActive ? (startMap[firstActive.id] ?? 0) : 0;
	}

	const fillerLabel = $derived(`Remove fillers · ${fillerCount}`);

	/** Speaker label driving a sentence's header (first labeled word), or null when undiarized. */
	function sentenceSpeakerLabel(words: (typeof sentences)[number]['words']): string | null {
		return words.find((word) => word.speaker)?.speaker ?? null;
	}

	function speakerForLabel(label: string | null): TranscriptSpeakerData {
		return (label && speakersByLabel?.[label]) || speaker;
	}

	type TranscriptRow =
		| { kind: 'speaker'; key: string; data: TranscriptSpeakerData }
		| { kind: 'sentence'; sentence: (typeof sentences)[number]; startTime: number };

	/** Interleaves a speaker header before each run of same-speaker sentences. */
	const rows = $derived.by(() => {
		const out: TranscriptRow[] = [];

		// Keep the fallback header visible even before any sentences exist.
		if (sentences.length === 0) {
			out.push({ kind: 'speaker', key: 'speaker-default', data: speaker });
			return out;
		}

		let lastLabel: string | null | undefined;

		for (const sentence of sentences) {
			const label = sentenceSpeakerLabel(sentence.words);
			if (label !== lastLabel) {
				out.push({
					kind: 'speaker',
					key: `speaker-${sentence.id}`,
					data: speakerForLabel(label)
				});
				lastLabel = label;
			}
			out.push({
				kind: 'sentence',
				sentence,
				startTime: sentenceStartTime(sentence.id, sentence.words)
			});
		}

		return out;
	});
</script>

<section class={['transcript-panel', className]} aria-label="Transcript">
	<header class="transcript-panel__header">
		<h2 class="transcript-panel__title">Transcript</h2>
		{#if isReady}
			<TranscriptSearch value={searchQuery} oninput={onsearch} />
		{/if}
		{#if showTranscribeAction}
			<Button
				variant={isReady ? 'secondary' : 'primary'}
				size="sm"
				class={transcribeActionClass}
				disabled={transcribeDisabled || transcribePending}
				onclick={ontranscribe}
			>
				{transcribePending ? 'Starting…' : 'Transcribe'}
			</Button>
		{/if}
		{#if isReady}
			<Button
				variant="accent-outline"
				size="sm"
				class="transcript-panel__filler-action"
				onclick={onremovefillers}
			>
				<span class="transcript-panel__filler-dot" aria-hidden="true"></span>
				{fillerLabel}
			</Button>
		{/if}
	</header>

	{#if isReady}
		<TranscriptSelectionBar visible={hasSelection} {selectedText} {deleteLabel} {ondelete} />
	{/if}

	<div class="transcript-panel__body">
		{#if isTranscribing}
			<TranscriptTranscribingState stage={transcriptionStage} progress={transcriptionProgress} />
		{:else if status === 'no-audio'}
			<TranscriptUnavailableState variant="no-audio" />
		{:else if status === 'unavailable'}
			<TranscriptUnavailableState />
		{:else if isIdle}
			<TranscriptIdleState processing={mediaProcessing} />
		{:else}
			{#each rows as row (row.kind === 'speaker' ? row.key : row.sentence.id)}
				{#if row.kind === 'speaker'}
					<TranscriptSpeaker speaker={row.data} />
				{:else}
					<TranscriptSentence
						sentence={row.sentence}
						startTime={row.startTime}
						{currentWordId}
						{selectedWordId}
						{searchQuery}
						{showFiller}
						onTimeClick={(event) => onsentenceclick?.(row.sentence, event)}
						onWordClick={onwordclick}
					/>
				{/if}
			{/each}
		{/if}
	</div>
</section>

<style>
	.transcript-panel {
		display: flex;
		flex: 1.25;
		flex-direction: column;
		min-width: 0;
		border-right: 1px solid var(--border-2);
		background: var(--surface-2);
	}

	.transcript-panel__header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 22px;
		border-bottom: 1px solid var(--border-2);
	}

	.transcript-panel__title {
		margin: 0;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-1);
	}

	.transcript-panel :global(.transcript-panel__transcribe-action--primary) {
		margin-left: auto;
		flex-shrink: 0;
	}

	.transcript-panel :global(.transcript-panel__filler-action) {
		margin-left: auto;
		flex-shrink: 0;
	}

	.transcript-panel__filler-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--accent);
	}

	.transcript-panel__body {
		flex: 1;
		overflow-y: auto;
		padding: 24px 22px 80px;
	}
</style>

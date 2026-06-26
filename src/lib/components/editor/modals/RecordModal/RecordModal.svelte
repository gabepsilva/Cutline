<script lang="ts">
	import Modal from '$lib/components/ui/Modal/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { DEFAULT_RECORD_THUMB } from '$lib/types/media';
	import type { RecordModalStep, RecordSource } from '../RecordModal.types';
	import RecordPreview from './RecordPreview.svelte';
	import RecordReview from './RecordReview.svelte';
	import RecordSourceTabs from './RecordSourceTabs.svelte';

	interface Props {
		open: boolean;
		step?: RecordModalStep;
		source?: RecordSource;
		recording?: boolean;
		countingDown?: boolean;
		countdown?: number;
		elapsedLabel?: string;
		reviewName?: string;
		reviewDurationLabel?: string;
		reviewThumb?: string;
		camDenied?: boolean;
		onvideomount?: (el: HTMLVideoElement | null) => void;
		onclose?: () => void;
		onsourcechange?: (source: RecordSource) => void;
		onstart?: () => void;
		onstop?: () => void;
		onkeep?: () => void;
		onaddtotimeline?: () => void;
		class?: string;
	}

	let {
		open,
		step = 'preview',
		source = 'camera',
		recording = false,
		countingDown = false,
		countdown = 3,
		elapsedLabel = '0:00',
		reviewName = 'New recording',
		reviewDurationLabel = '0:12',
		reviewThumb = DEFAULT_RECORD_THUMB,
		camDenied = true,
		onvideomount,
		onclose,
		onsourcechange,
		onstart,
		onstop,
		onkeep,
		onaddtotimeline,
		class: className = ''
	}: Props = $props();

	const idle = $derived(!recording && !countingDown);
</script>

<Modal {open} title="Record" layer="record" {onclose} class={className}>
	{#snippet header({ titleId })}
		<h2 id={titleId} class="record-modal__title">
			<span class="record-modal__title-dot" aria-hidden="true"></span>
			Record
		</h2>
	{/snippet}

	{#if step === 'review'}
		<RecordReview
			name={reviewName}
			durationLabel={reviewDurationLabel}
			thumb={reviewThumb}
			{onkeep}
			{onaddtotimeline}
		/>
	{:else}
		<RecordPreview
			{recording}
			{countingDown}
			{countdown}
			{elapsedLabel}
			simulated={camDenied}
			{onvideomount}
		/>
		<RecordSourceTabs selected={source} onselect={onsourcechange} />

		{#if idle}
			<Button variant="danger" size="lg" class="record-modal__primary" onclick={onstart}>
				<span class="record-modal__start-dot" aria-hidden="true"></span>
				Start recording
			</Button>
		{:else if countingDown}
			<div class="record-modal__waiting" role="status">Get ready…</div>
		{:else}
			<Button variant="primary" size="lg" class="record-modal__primary" onclick={onstop}>
				<span class="record-modal__stop-icon" aria-hidden="true"></span>
				Stop & save · {elapsedLabel}
			</Button>
		{/if}
	{/if}
</Modal>

<style>
	.record-modal__title {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 0;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-1);
	}

	.record-modal__title-dot {
		width: 9px;
		height: 9px;
		border-radius: var(--radius-pill);
		background: var(--danger);
	}

	:global(.record-modal__primary.button) {
		width: 100%;
		padding: 13px;
		font-size: 14px;
		border-radius: 11px;
		gap: 10px;
	}

	.record-modal__start-dot {
		width: 12px;
		height: 12px;
		border-radius: var(--radius-pill);
		background: var(--on-danger);
	}

	.record-modal__stop-icon {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		background: var(--on-accent);
	}

	.record-modal__waiting {
		text-align: center;
		padding: 13px;
		background: var(--surface-7);
		border: 1px solid var(--border-6);
		color: var(--text-6);
		font-size: 14px;
		border-radius: 11px;
	}
</style>

<script lang="ts">
	import RecBadge from '$lib/components/ui/RecBadge.svelte';
	import SimulatedVideoFrame from '$lib/components/ui/SimulatedVideoFrame.svelte';

	interface Props {
		recording?: boolean;
		countingDown?: boolean;
		countdown?: number;
		elapsedLabel?: string;
		simulated?: boolean;
		onvideomount?: (el: HTMLVideoElement | null) => void;
		class?: string;
	}

	let {
		recording = false,
		countingDown = false,
		countdown = 3,
		elapsedLabel = '0:00',
		simulated = true,
		onvideomount,
		class: className = ''
	}: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);

	$effect(() => {
		onvideomount?.(videoEl);
	});
</script>

<div class={['record-preview', className]}>
	{#if !simulated}
		<video bind:this={videoEl} class="record-preview__video" autoplay muted playsinline></video>
	{:else}
		<SimulatedVideoFrame
			withBackground
			glowPos="42% 44%"
			subjectX="42%"
			subjectY="48%"
			caption="simulated camera preview · grant camera access for live"
		/>
	{/if}

	{#if recording}
		<RecBadge label="REC {elapsedLabel}" class="record-preview__rec" />
	{/if}

	{#if countingDown}
		<div class="record-preview__countdown" role="status" aria-live="polite">
			{countdown}
		</div>
	{/if}
</div>

<style>
	.record-preview {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 13px;
		overflow: hidden;
		background: var(--surface-base);
		border: 1px solid var(--border-4);
		margin-bottom: 16px;
	}

	.record-preview__video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.record-preview :global(.record-preview__rec) {
		position: absolute;
		left: 10px;
		top: 10px;
		padding: 5px 11px;
		border-radius: var(--radius-sm);
		font-size: 12px;
	}

	.record-preview__countdown {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(0 0 0 / 45%);
		font-size: 84px;
		font-weight: 700;
		color: var(--text-bright);
		font-family: var(--font-mono);
	}
</style>

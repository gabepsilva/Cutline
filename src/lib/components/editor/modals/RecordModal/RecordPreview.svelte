<script lang="ts">
	import RecBadge from '$lib/components/ui/RecBadge.svelte';

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
		<div class="record-preview__simulated" aria-hidden="true">
			<div class="record-preview__simulated-glow"></div>
			<div class="record-preview__simulated-subject"></div>
			<p class="record-preview__simulated-caption">
				simulated camera preview · grant camera access for live
			</p>
		</div>
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

	.record-preview__simulated {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			135deg,
			var(--surface-5) 0 14px,
			var(--surface-2) 14px 28px
		);
	}

	.record-preview__simulated-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(58% 75% at 42% 44%, var(--accent-tint-14), transparent 68%);
	}

	.record-preview__simulated-subject {
		position: absolute;
		left: 42%;
		top: 48%;
		transform: translate(-50%, -50%);
		width: 120px;
		height: 120px;
		border-radius: var(--radius-pill);
		background: radial-gradient(circle at 40% 35%, var(--border-7), var(--surface-5));
		border: 1px solid var(--border-7);
	}

	.record-preview__simulated-caption {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 14px;
		margin: 0;
		text-align: center;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-8);
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

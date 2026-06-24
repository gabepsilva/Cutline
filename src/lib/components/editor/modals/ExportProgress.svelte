<script lang="ts">
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';

	interface Props {
		progress: number;
		progressLabel: string;
		detail: string;
		class?: string;
	}

	let { progress, progressLabel, detail, class: className = '' }: Props = $props();
</script>

<div class={['export-progress', className]} role="status" aria-label="Export in progress">
	<div class="export-progress__spinner" aria-hidden="true"></div>
	<p class="export-progress__title">Exporting…</p>
	<p class="export-progress__detail">{detail}</p>
	<ProgressBar value={progress} label="Export progress" class="export-progress__bar" />
	<p class="export-progress__label">{progressLabel}</p>
</div>

<style>
	.export-progress {
		text-align: center;
		padding: 14px 0;
	}

	.export-progress__spinner {
		width: 46px;
		height: 46px;
		margin: 0 auto 18px;
		border-radius: var(--radius-pill);
		border: 3px solid var(--border-6);
		border-top-color: var(--accent);
		animation: spin 0.8s linear infinite;
	}

	.export-progress__title {
		margin: 0 0 6px;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-1);
	}

	.export-progress__detail {
		margin: 0 0 18px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-7);
	}

	.export-progress__label {
		margin: 9px 0 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-6);
	}

	.export-progress :global(.export-progress__bar .progress-bar__track) {
		height: 7px;
	}
</style>

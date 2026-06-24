<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		filename: string;
		detail: string;
		ondone?: () => void;
		ondownload?: () => void;
		class?: string;
	}

	let { filename, detail, ondone, ondownload, class: className = '' }: Props = $props();
</script>

<div class={['export-complete', className]} role="status" aria-label="Export complete">
	<div class="export-complete__icon" aria-hidden="true">
		<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
			<polyline
				points="5,12 10,17 19,7"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
	<p class="export-complete__title">Export complete</p>
	<p class="export-complete__detail">{filename} · {detail}</p>
	<div class="export-complete__actions">
		<Button variant="secondary" onclick={ondone}>Done</Button>
		<Button variant="primary" onclick={ondownload ?? ondone}>Download</Button>
	</div>
</div>

<style>
	.export-complete {
		text-align: center;
		padding: 14px 0;
	}

	.export-complete__icon {
		width: 54px;
		height: 54px;
		margin: 0 auto 16px;
		border-radius: var(--radius-pill);
		background: var(--accent-tint-14);
		border: 1px solid var(--accent);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.export-complete__title {
		margin: 0 0 6px;
		font-size: 17px;
		font-weight: 600;
		color: var(--text-1);
	}

	.export-complete__detail {
		margin: 0 0 20px;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-7);
	}

	.export-complete__actions {
		display: flex;
		gap: 10px;
	}

	.export-complete__actions :global(.button) {
		flex: 1;
		padding: 11px;
		font-size: 13px;
		border-radius: 9px;
	}
</style>

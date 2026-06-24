<script lang="ts">
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import type { StorageUsage } from '$lib/types/storage';

	interface Props {
		usage: StorageUsage;
		class?: string;
	}

	let { usage, class: className = '' }: Props = $props();

	const percentLabel = $derived(`${Math.round(usage.percentUsed)}%`);
</script>

<section class={['app-sidebar-storage', className]} aria-label="Storage usage">
	<div class="app-sidebar-storage__header">
		<span class="app-sidebar-storage__title">Storage</span>
		<span class="app-sidebar-storage__percent">{percentLabel}</span>
	</div>
	<ProgressBar value={usage.percentUsed} class="app-sidebar-storage__bar" />
	<p class="app-sidebar-storage__caption">{usage.usageLabel}</p>
</section>

<style>
	.app-sidebar-storage {
		padding: 14px 11px;
		border: 1px solid var(--border-4);
		border-radius: 10px;
		background: var(--surface-4);
	}

	.app-sidebar-storage__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
		font-size: 11px;
		color: var(--text-7);
	}

	.app-sidebar-storage__percent {
		font-family: var(--font-mono);
	}

	.app-sidebar-storage__bar {
		height: 5px;
	}

	.app-sidebar-storage__caption {
		margin: 8px 0 0;
		font-size: 10.5px;
		color: var(--text-8);
		line-height: 1.3;
	}
</style>

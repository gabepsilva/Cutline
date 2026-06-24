<script lang="ts">
	import Chip from '$lib/components/ui/Chip.svelte';
	import type { RecordSource } from '../RecordModal.types';

	interface Props {
		selected?: RecordSource;
		onselect?: (source: RecordSource) => void;
		class?: string;
	}

	let { selected = 'camera', onselect, class: className = '' }: Props = $props();

	const sources: { id: RecordSource; label: string }[] = [
		{ id: 'camera', label: 'Camera' },
		{ id: 'screen', label: 'Screen' },
		{ id: 'camera-screen', label: 'Camera + Screen' }
	];
</script>

<div class={['record-source-tabs', className]}>
	<span class="record-source-tabs__label">Source</span>
	<div class="record-source-tabs__chips" role="group" aria-label="Recording source">
		{#each sources as source (source.id)}
			<Chip selected={selected === source.id} onclick={() => onselect?.(source.id)}>
				{source.label}
			</Chip>
		{/each}
	</div>
</div>

<style>
	.record-source-tabs {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 18px;
	}

	.record-source-tabs__label {
		font-size: 11px;
		color: var(--text-7);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.record-source-tabs__chips {
		display: flex;
		gap: 9px;
	}

	.record-source-tabs__chips :global(.chip) {
		padding: 6px 13px;
		font-size: 12px;
	}
</style>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TimelineTick } from './Timeline.types';

	interface Props {
		ticks?: TimelineTick[];
		ticksSlot?: Snippet;
		class?: string;
	}

	let { ticks = [], ticksSlot, class: className = '' }: Props = $props();
</script>

<div class={['timeline-ruler', className]} role="presentation">
	{#if ticksSlot}
		{@render ticksSlot()}
	{:else}
		{#each ticks as tick (tick.id)}
			<div class="timeline-ruler__tick" style:left={tick.left}>
				<span class="timeline-ruler__label">{tick.label}</span>
			</div>
		{/each}
	{/if}
</div>

<style>
	.timeline-ruler {
		position: relative;
		height: var(--ruler-h);
		flex: 0 0 var(--ruler-h);
		border-bottom: 1px solid var(--border-faint);
	}

	.timeline-ruler__tick {
		position: absolute;
		top: 0;
		bottom: 0;
		border-left: 1px solid var(--border-5);
		padding-left: 5px;
		display: flex;
		align-items: center;
	}

	.timeline-ruler__label {
		font-family: var(--font-mono);
		font-size: 9.5px;
		color: var(--text-9);
		white-space: nowrap;
	}
</style>

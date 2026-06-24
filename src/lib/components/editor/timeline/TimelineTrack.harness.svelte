<script lang="ts">
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import TimelineTrack from './TimelineTrack.svelte';

	interface Props {
		showEmpty?: boolean;
	}

	let { showEmpty = true }: Props = $props();
</script>

<TimelineTrack>
	{#if showEmpty}
		<EmptyState title="Record or add B-roll — clips drop here at the playhead" />
	{:else}
		<div data-testid="track-content">Clip content</div>
	{/if}
</TimelineTrack>

<script lang="ts">
	import { fixtureTimelineOverlay } from '$lib/test/fixtures/timeline-overlay';
	import type { Overlay } from '$lib/types/timeline';
	import TimelineTrack from './TimelineTrack.svelte';

	interface Props {
		label?: string;
		variant?: 'default' | 'waveform' | 'broll';
		overlays?: Overlay[];
		totalDuration?: number;
		onoverlayclick?: (overlay: Overlay) => void;
		onoverlayremove?: (id: string) => void;
	}

	let {
		label = 'Track content',
		variant = 'default',
		overlays = [fixtureTimelineOverlay],
		totalDuration = 120,
		onoverlayclick,
		onoverlayremove
	}: Props = $props();
</script>

<div class="timeline-track-harness">
	{#if variant === 'broll'}
		<TimelineTrack variant="broll" {overlays} {totalDuration} {onoverlayclick} {onoverlayremove} />
	{:else}
		<TimelineTrack {variant} padded={variant !== 'waveform'}>
			<div data-testid="track-content">{label}</div>
		</TimelineTrack>
	{/if}
</div>

<style>
	.timeline-track-harness {
		position: relative;
		width: 400px;
		height: 80px;
		display: flex;
	}
</style>

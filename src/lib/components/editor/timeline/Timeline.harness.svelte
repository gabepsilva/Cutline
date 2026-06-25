<script lang="ts">
	import type { Overlay } from '$lib/types/timeline';
	import {
		mockTimelineBars,
		mockTimelineClips,
		mockTimelineOverlays,
		mockTimelinePlayheadPercent,
		mockTimelineResourceCount,
		mockTimelineTicks
	} from '$lib/mocks/timeline.mock';
	import Timeline from './Timeline.svelte';

	interface Props {
		brollEmpty?: boolean;
		overlays?: Overlay[];
		onoverlayclick?: (overlay: Overlay) => void;
		onrecord?: () => void;
		onmedia?: () => void;
		onsnapchange?: (enabled: boolean) => void;
		onseek?: (event: MouseEvent) => void;
	}

	let {
		brollEmpty = false,
		overlays = mockTimelineOverlays,
		onoverlayclick,
		onrecord,
		onmedia,
		onsnapchange,
		onseek
	}: Props = $props();
</script>

<Timeline
	ticks={mockTimelineTicks}
	bars={mockTimelineBars}
	clips={mockTimelineClips}
	playheadPercent={mockTimelinePlayheadPercent}
	resourceCount={mockTimelineResourceCount}
	{overlays}
	{brollEmpty}
	{onoverlayclick}
	{onrecord}
	{onmedia}
	{onsnapchange}
	{onseek}
/>

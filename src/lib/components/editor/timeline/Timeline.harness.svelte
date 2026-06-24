<script lang="ts">
	import {
		mockTimelineBars,
		mockTimelineClips,
		mockTimelinePlayheadPercent,
		mockTimelineResourceCount,
		mockTimelineTicks
	} from '$lib/mocks/timeline.mock';
	import Timeline from './Timeline.svelte';

	interface Props {
		onrecord?: () => void;
		onmedia?: () => void;
		onsnapchange?: (enabled: boolean) => void;
		onseek?: (event: MouseEvent) => void;
	}

	let { onrecord, onmedia, onsnapchange, onseek }: Props = $props();
</script>

<Timeline
	ticks={mockTimelineTicks}
	bars={mockTimelineBars}
	clips={mockTimelineClips}
	playheadPercent={mockTimelinePlayheadPercent}
	resourceCount={mockTimelineResourceCount}
	{onrecord}
	{onmedia}
	{onsnapchange}
	{onseek}
/>

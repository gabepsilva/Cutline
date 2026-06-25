<script lang="ts">
	import type { Clip } from '$lib/types/timeline';
	import { fixtureTimelineClip } from '$lib/test/fixtures/timeline-clip';
	import TimelineClip from './TimelineClip.svelte';
	import type { TimelineClipVariant } from './TimelineClip.types';

	interface Props {
		clip?: Clip;
		variant?: TimelineClipVariant;
	}

	let { clip = fixtureTimelineClip, variant = 'video' }: Props = $props();
</script>

<div class="timeline-clip-harness">
	<TimelineClip id="clip-fixture" {clip} {variant} />
</div>

<style>
	.timeline-clip-harness {
		position: relative;
		width: 480px;
		height: 48px;
		background: var(--surface-1);
	}
</style>

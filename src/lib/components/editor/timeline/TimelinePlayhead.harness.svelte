<script lang="ts">
	import TimelinePlayhead from './TimelinePlayhead.svelte';

	interface Props {
		positionPercent?: number;
	}

	let { positionPercent = 42 }: Props = $props();
</script>

<div style="position: relative; width: 400px; height: 120px;">
	<TimelinePlayhead {positionPercent} />
</div>

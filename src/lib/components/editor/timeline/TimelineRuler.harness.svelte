<script lang="ts">
	import TimelineRuler from './TimelineRuler.svelte';
	import type { TimelineTick } from './Timeline.types';

	interface Props {
		ticks?: TimelineTick[];
	}

	let { ticks }: Props = $props();

	const defaultTicks: TimelineTick[] = [
		{ id: 't0', left: '0.000%', label: '0:00' },
		{ id: 't1', left: '12.500%', label: '0:34' },
		{ id: 't2', left: '25.000%', label: '1:08' }
	];
</script>

<TimelineRuler ticks={ticks ?? defaultTicks} />

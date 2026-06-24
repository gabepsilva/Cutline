<script lang="ts">
	import type { TimelineBar } from './Timeline.types';
	import TimelineWaveform from './TimelineWaveform.svelte';

	interface Props {
		bars?: TimelineBar[];
		playedPercent?: number;
	}

	let { bars, playedPercent = 35 }: Props = $props();

	const defaultBars: TimelineBar[] = [
		{ id: 'b1', left: '4.000%', width: '1.200%', height: '42.0%' },
		{ id: 'b2', left: '8.000%', width: '1.200%', height: '68.0%' },
		{ id: 'b3', left: '12.000%', width: '1.200%', height: '30.0%' }
	];
</script>

<div style="position: relative; width: 100%; height: 80px; background: var(--surface-2);">
	<TimelineWaveform bars={bars ?? defaultBars} {playedPercent} />
</div>

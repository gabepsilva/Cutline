<script lang="ts">
	import TimelineTrack from './TimelineTrack.svelte';

	interface Props {
		label?: string;
		variant?: 'default' | 'waveform';
	}

	let { label = 'Track content', variant = 'default' }: Props = $props();
</script>

<div class="timeline-track-harness">
	<TimelineTrack {variant} padded={variant !== 'waveform'}>
		<div data-testid="track-content">{label}</div>
	</TimelineTrack>
</div>

<style>
	.timeline-track-harness {
		position: relative;
		width: 400px;
		height: 80px;
		display: flex;
	}
</style>

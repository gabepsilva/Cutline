<script lang="ts">
	import TransportControls from './TransportControls.svelte';

	interface Props {
		playing?: boolean;
		current?: number;
		total?: number;
		ontoStart?: () => void;
		ontogglePlay?: () => void;
		ontoEnd?: () => void;
	}

	let {
		playing = false,
		current = 65,
		total = 272,
		ontoStart,
		ontogglePlay,
		ontoEnd
	}: Props = $props();
</script>

<TransportControls {playing} {current} {total} {ontoStart} {ontogglePlay} {ontoEnd} />

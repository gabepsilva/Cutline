<script lang="ts">
	import TimelineToolbar from './TimelineToolbar.svelte';

	interface Props {
		resourceCount?: number;
		snapEnabled?: boolean;
		onrecord?: () => void;
		onmedia?: () => void;
		onsnapchange?: (enabled: boolean) => void;
	}

	let { resourceCount = 3, snapEnabled = true, onrecord, onmedia, onsnapchange }: Props = $props();
</script>

<TimelineToolbar {resourceCount} {snapEnabled} {onrecord} {onmedia} {onsnapchange} />

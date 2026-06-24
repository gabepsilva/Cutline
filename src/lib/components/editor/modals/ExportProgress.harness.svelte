<script lang="ts">
	import ExportProgress from './ExportProgress.svelte';

	interface Props {
		progress?: number;
		progressLabel?: string;
		detail?: string;
		class?: string;
	}

	let {
		progress = 42,
		progressLabel = '42%',
		detail = 'Encoding 1080p · burn-in captions',
		class: className = ''
	}: Props = $props();
</script>

<ExportProgress {progress} {progressLabel} {detail} class={className} />

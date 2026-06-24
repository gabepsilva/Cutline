<script lang="ts">
	import ExportComplete from './ExportComplete.svelte';

	interface Props {
		filename?: string;
		detail?: string;
		ondone?: () => void;
		ondownload?: () => void;
		class?: string;
	}

	let {
		filename = 'cutline-export.mp4',
		detail = '1080p · 4:32',
		ondone,
		ondownload,
		class: className = ''
	}: Props = $props();
</script>

<ExportComplete {filename} {detail} {ondone} {ondownload} class={className} />

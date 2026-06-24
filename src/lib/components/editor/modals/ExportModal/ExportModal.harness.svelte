<script lang="ts">
	import ExportModal from './ExportModal.svelte';
	import type { ExportFormat, ExportResolution } from '../ExportModal.types';

	interface Props {
		open?: boolean;
		format?: ExportFormat;
		resolution?: ExportResolution;
		burnCaptions?: boolean;
		totalTimecode?: string;
		onclose?: () => void;
		onformatchange?: (format: ExportFormat) => void;
		onresolutionchange?: (resolution: ExportResolution) => void;
		onburncaptionschange?: (enabled: boolean) => void;
		onexport?: () => void;
		class?: string;
	}

	let {
		open = true,
		format = 'mp4',
		resolution = '1080p',
		burnCaptions = true,
		totalTimecode = '4:32',
		onclose,
		onformatchange,
		onresolutionchange,
		onburncaptionschange,
		onexport,
		class: className = ''
	}: Props = $props();
</script>

<ExportModal
	{open}
	{format}
	{resolution}
	{burnCaptions}
	{totalTimecode}
	{onclose}
	{onformatchange}
	{onresolutionchange}
	{onburncaptionschange}
	{onexport}
	class={className}
/>

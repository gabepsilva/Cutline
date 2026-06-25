<script lang="ts">
	import Modal from '$lib/components/ui/Modal/Modal.svelte';
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import { exportFilename, startMockExportJob } from '$lib/editor/export-job';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import ExportComplete from './ExportComplete.svelte';
	import ExportModal from './ExportModal/ExportModal.svelte';
	import type { ExportFormat, ExportResolution } from './ExportModal.types';
	import ExportProgress from './ExportProgress.svelte';

	interface Props {
		editor: EditorState;
		projectTitle: string;
		class?: string;
	}

	let { editor, projectTitle, class: className = '' }: Props = $props();

	let format = $state<ExportFormat>('mp4');
	let resolution = $state<ExportResolution>('1080p');
	let burnCaptions = $state(true);

	const open = $derived(editor.exportPhase !== 'none');
	const configOpen = $derived(editor.exportPhase === 'config');
	const exportingOpen = $derived(editor.exportPhase === 'exporting');
	const doneOpen = $derived(editor.exportPhase === 'done');

	const totalTimecode = $derived(formatTimecode(editor.duration));
	const progressPercent = $derived(Math.round(editor.exportProgress * 100));
	const progressLabel = $derived(`${progressPercent}%`);
	const exportDetail = $derived(
		`Rendering ${totalTimecode} at ${resolution} · ${format.toUpperCase()}`
	);
	const completeFilename = $derived(exportFilename(projectTitle, format));
	const completeDetail = $derived(resolution);

	$effect(() => {
		if (!exportingOpen) return;
		return startMockExportJob(editor);
	});

	function handleClose() {
		editor.closeExport();
	}

	function handleExport() {
		editor.runExport();
	}
</script>

{#if configOpen}
	<ExportModal
		{open}
		{format}
		{resolution}
		{burnCaptions}
		{totalTimecode}
		onclose={handleClose}
		onformatchange={(value) => (format = value)}
		onresolutionchange={(value) => (resolution = value)}
		onburncaptionschange={(value) => (burnCaptions = value)}
		onexport={handleExport}
		class={className}
	/>
{:else if exportingOpen}
	<Modal open title="Export video" layer="export" onclose={handleClose} class={className}>
		<ExportProgress progress={progressPercent} {progressLabel} detail={exportDetail} />
	</Modal>
{:else if doneOpen}
	<Modal open title="Export video" layer="export" onclose={handleClose} class={className}>
		<ExportComplete
			filename={completeFilename}
			detail={completeDetail}
			ondone={handleClose}
			ondownload={handleClose}
		/>
	</Modal>
{/if}

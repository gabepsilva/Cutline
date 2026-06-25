<script lang="ts">
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import { formatMediaDuration } from '$lib/types/media';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import {
		startCamera,
		startRecordCountdown,
		startRecordingElapsed
	} from '$lib/editor/record-flow';
	import ExportFlow from './modals/ExportFlow.svelte';
	import MediaShelf from './modals/MediaShelf.svelte';
	import RecordModal from './modals/RecordModal/RecordModal.svelte';
	import type { RecordModalStep } from './modals/RecordModal.types';

	interface Props {
		editor: EditorState;
		projectTitle: string;
	}

	let { editor, projectTitle }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);

	const recordOpen = $derived(editor.recordPhase !== 'none');
	const recordStep = $derived<RecordModalStep>(
		editor.recordPhase === 'review' ? 'review' : 'preview'
	);
	const recording = $derived(editor.recordPhase === 'recording');
	const countingDown = $derived(editor.recordPhase === 'countdown');
	const elapsedLabel = $derived(formatTimecode(editor.recElapsed));

	const lastRecording = $derived(
		editor.lastResId ? editor.resources.find((resource) => resource.id === editor.lastResId) : null
	);

	const reviewName = $derived(lastRecording?.name ?? 'New recording');
	const reviewDurationLabel = $derived(
		lastRecording ? formatMediaDuration(lastRecording.dur) : '0:00'
	);
	const reviewThumb = $derived(
		lastRecording?.thumb ?? 'repeating-linear-gradient(135deg,#161619 0 14px,#121215 14px 28px)'
	);

	$effect(() => {
		const needsCamera =
			editor.recordPhase === 'live' ||
			editor.recordPhase === 'countdown' ||
			editor.recordPhase === 'recording';
		if (!needsCamera || editor.camDenied) return;
		return startCamera(videoEl, () => {
			editor.camDenied = true;
		});
	});

	$effect(() => {
		if (editor.recordPhase !== 'countdown') return;
		return startRecordCountdown(editor);
	});

	$effect(() => {
		if (editor.recordPhase !== 'recording') return;
		return startRecordingElapsed(editor);
	});
</script>

<MediaShelf
	open={editor.showMedia}
	resources={editor.resources}
	onclose={() => (editor.showMedia = false)}
	onrecord={() => editor.openRecord()}
	onresourceclick={(resource) => editor.addOverlay(resource)}
/>

<RecordModal
	open={recordOpen}
	step={recordStep}
	{recording}
	{countingDown}
	countdown={editor.recCount}
	{elapsedLabel}
	camDenied={editor.camDenied}
	{reviewName}
	{reviewDurationLabel}
	{reviewThumb}
	onvideomount={(el) => (videoEl = el)}
	onclose={() => editor.closeRecord()}
	onstart={() => editor.beginRecording()}
	onstop={() => editor.stopRecording()}
	onkeep={() => editor.closeRecord()}
	onaddtotimeline={() => editor.addLastToTimeline()}
/>

<ExportFlow {editor} {projectTitle} />

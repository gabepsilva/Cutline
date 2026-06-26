<script lang="ts">
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import { uploadMediaForEditor } from '$lib/editor/media-upload';
	import { DEFAULT_RECORD_THUMB, formatMediaDuration } from '$lib/types/media';
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
		projectId: string;
		projectTitle: string;
	}

	let { editor, projectId, projectTitle }: Props = $props();

	let videoEl = $state<HTMLVideoElement | null>(null);
	let uploadProgress = $state<number | null>(null);
	let uploading = $state(false);

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
	const reviewThumb = $derived(lastRecording?.thumb ?? DEFAULT_RECORD_THUMB);

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

	async function handleUpload(file: File) {
		if (uploading) return;
		uploading = true;
		uploadProgress = 0;

		try {
			await uploadMediaForEditor(editor, projectId, file, (ratio) => {
				uploadProgress = ratio;
			});
		} catch {
			// Upload errors surface via failed network response; shelf stays usable.
		} finally {
			uploading = false;
			uploadProgress = null;
		}
	}
</script>

<MediaShelf
	open={editor.showMedia}
	resources={editor.resources}
	{uploading}
	{uploadProgress}
	onclose={() => (editor.showMedia = false)}
	onrecord={() => editor.openRecord()}
	onupload={handleUpload}
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

<ExportFlow {editor} {projectId} {projectTitle} />

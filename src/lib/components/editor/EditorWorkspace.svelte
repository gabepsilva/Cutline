<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EditorLayout from '$lib/components/editor/EditorLayout.svelte';
	import EditorModals from '$lib/components/editor/EditorModals.svelte';
	import PreviewPanel from '$lib/components/editor/preview/PreviewPanel.svelte';
	import Timeline from '$lib/components/editor/timeline/Timeline.svelte';
	import TranscriptPanel from '$lib/components/editor/transcript/TranscriptPanel.svelte';
	import { captionWordsForCurrentSentence, trimmedLabel } from '$lib/editor/editor-derive';
	import {
		createEditorAutosave,
		editorSaveMeta,
		type EditorSaveStatus
	} from '$lib/editor/editor-save';
	import { EditorState } from '$lib/editor/editor-state.svelte';
	import {
		loadIngestAssets,
		pollIngestAssets,
		type IngestAssetsState
	} from '$lib/editor/ingest-assets';
	import { TranscriptionController } from '$lib/editor/transcription-controller.svelte';
	import type { EditorProjectLoad } from '$lib/types/editor-load';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import { resolveEditorKeyAction, shouldPreventDefault } from '$lib/utils/editor-keyboard';

	type Props = Omit<EditorProjectLoad, 'mode'>;

	let {
		project,
		meta,
		words,
		captionStyle,
		sentences,
		speaker,
		speakers,
		videoUrl,
		aRoll,
		resources,
		overlays,
		transcriptionJobId,
		transcriptionFailed
	}: Props = $props();

	let trackedMediaId = $state<string | null>(null);
	let ingestAssets = $state<IngestAssetsState | null>(null);
	const transcription = new TranscriptionController(
		() => words.length,
		() => aRoll,
		() => transcriptionFailed
	);
	const playbackUrl = $derived(ingestAssets?.transcodeUrl ?? videoUrl);

	$effect(() => {
		if (aRoll?.mediaId) {
			trackedMediaId = aRoll.mediaId;
		}
	});

	$effect(() => {
		const mediaId = trackedMediaId;
		if (!mediaId) {
			ingestAssets = null;
			return;
		}

		let stopPoll: (() => void) | undefined;
		let canceled = false;

		void loadIngestAssets(project.id, mediaId).then((state) => {
			if (canceled) return;
			ingestAssets = state;
			if (state.status === 'ingesting') {
				stopPoll = pollIngestAssets(project.id, mediaId, (next) => {
					ingestAssets = next;
				});
			}
		});

		return () => {
			canceled = true;
			stopPoll?.();
		};
	});

	$effect(() => {
		void words.length;
		return transcription.bind(transcriptionJobId);
	});

	const transcriptUi = $derived(transcription.ui);

	const editor = $derived.by(
		() => new EditorState({ words, sentences, resources, captionStyle, overlays })
	);

	const speakersByLabel = $derived(
		Object.fromEntries(
			speakers.map((entry) => [entry.speaker, { name: entry.name, initials: entry.initials }])
		)
	);

	let saveStatus = $state<EditorSaveStatus>('idle');

	const autosave = createEditorAutosave({
		onStatus: (status) => {
			saveStatus = status;
		}
	});

	let savedEditor: EditorState | undefined;

	$effect(() => {
		const payload = {
			words: editor.words,
			captionStyle: editor.captionStyle,
			overlays: editor.overlays
		};

		// Skip the first run for each freshly loaded editor: the loaded transcript is
		// already persisted, so autosaving it would write identical data and flash the
		// save status on every open. Only schedule once a real edit mutates this instance.
		if (savedEditor !== editor) {
			savedEditor = editor;
			return;
		}

		autosave.schedule(project.id, payload);
	});

	onDestroy(() => autosave.dispose());

	const topBarMeta = $derived(editorSaveMeta(saveStatus, meta));

	const selectedWord = $derived(
		editor.selectedId ? editor.words.find((word) => word.id === editor.selectedId) : null
	);

	const captionTokens = $derived(
		transcriptUi.status === 'ready'
			? captionWordsForCurrentSentence(editor.words, editor.currentWordId, editor.captionStyle)
			: []
	);

	const totalLabel = $derived(formatTimecode(editor.duration));
	const savedLabel = $derived(trimmedLabel(editor.deletedCount));

	function handleWindowKeydown(event: KeyboardEvent) {
		const target = event.target;
		const tagName = target instanceof HTMLElement ? target.tagName : '';

		const action = resolveEditorKeyAction({
			key: event.key,
			targetTagName: tagName,
			hasSelection: editor.selectedId !== null
		});

		if (!action) return;

		if (shouldPreventDefault(action)) {
			event.preventDefault();
		}

		if (action === 'toggle-play') {
			editor.togglePlay();
			return;
		}

		if (action === 'delete-selected') {
			editor.deleteSelected();
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<EditorLayout
	title={project.title}
	meta={topBarMeta}
	{editor}
	transcribing={transcriptUi.status === 'transcribing'}
	transcriptionProgress={transcriptUi.progress}
	onback={() => goto(resolve('/'))}
>
	<div class="editor-workspace" data-testid="editor-workspace">
		<div class="editor-workspace__stage">
			<div class="editor-workspace__panels">
				<TranscriptPanel
					sentences={editor.sentences}
					{speaker}
					{speakersByLabel}
					status={transcriptUi.status}
					transcriptionProgress={transcriptUi.progress}
					transcriptionStage={transcriptUi.stage}
					searchQuery={editor.query}
					fillerCount={editor.fillerCount}
					hasSelection={selectedWord !== null && selectedWord !== undefined}
					selectedText={selectedWord?.text ?? ''}
					deleteLabel={selectedWord?.deleted ? 'Restore word' : 'Delete word'}
					currentWordId={editor.currentWordId}
					selectedWordId={editor.selectedId}
					onsearch={(event) => editor.setQuery(event.currentTarget.value)}
					onremovefillers={() => editor.removeFillers()}
					ondelete={() => editor.deleteSelected()}
					onsentenceclick={(sentence) => editor.seekSentence(sentence)}
					onwordclick={(word) => editor.selectWord(word)}
				/>
				<PreviewPanel
					playing={editor.playing}
					currentTime={editor.clampedTime}
					{totalLabel}
					{savedLabel}
					deletedCount={editor.deletedCount}
					wordCount={editor.active.length}
					{captionTokens}
					captionStyle={editor.captionStyle}
					showCaptions={editor.showCaptions}
					videoUrl={playbackUrl}
					ontogglePlay={() => editor.togglePlay()}
					oncaptionstylechange={(style) => (editor.captionStyle = style)}
				/>
			</div>
			<Timeline {editor} {ingestAssets} transcriptStatus={transcriptUi.status} />
			<EditorModals {editor} projectId={project.id} projectTitle={project.title} />
		</div>
	</div>
</EditorLayout>

<style>
	.editor-workspace {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	.editor-workspace__stage {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		min-width: 0;
	}

	.editor-workspace__panels {
		display: flex;
		flex: 1;
		min-height: 0;
		min-width: 0;
	}
</style>

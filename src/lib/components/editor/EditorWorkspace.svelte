<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EditorLayout from '$lib/components/editor/EditorLayout.svelte';
	import EditorModals from '$lib/components/editor/EditorModals.svelte';
	import PreviewPanel from '$lib/components/editor/preview/PreviewPanel.svelte';
	import Timeline from '$lib/components/editor/timeline/Timeline.svelte';
	import TranscriptPanel from '$lib/components/editor/transcript/TranscriptPanel.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { captionWordsForCurrentSentence, trimmedLabel } from '$lib/editor/editor-derive';
	import {
		createEditorAutosave,
		editorSaveMeta,
		type EditorSaveStatus
	} from '$lib/editor/editor-save';
	import { EditorState } from '$lib/editor/editor-state.svelte';
	import { uploadMediaForEditor } from '$lib/editor/media-upload';
	import {
		loadIngestAssets,
		pollIngestAssets,
		type IngestAssetsState
	} from '$lib/editor/ingest-assets';
	import type { EditorProjectLoad } from '$lib/types/editor-load';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import { resolveEditorKeyAction, shouldPreventDefault } from '$lib/utils/editor-keyboard';

	type Props = EditorProjectLoad;

	let {
		project,
		meta,
		words,
		captionStyle,
		sentences,
		speaker,
		videoUrl,
		aRoll,
		resources,
		overlays
	}: Props = $props();

	let trackedMediaId = $state<string | null>(null);
	let ingestAssets = $state<IngestAssetsState | null>(null);
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

	const editor = $derived.by(
		() => new EditorState({ words, sentences, resources, captionStyle, overlays })
	);

	let saveStatus = $state<EditorSaveStatus>('idle');
	let emptyUploadInput = $state<HTMLInputElement | null>(null);
	let emptyUploading = $state(false);

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

	const hasTranscript = $derived(sentences.length > 0);

	const selectedWord = $derived(
		editor.selectedId ? editor.words.find((word) => word.id === editor.selectedId) : null
	);

	const captionTokens = $derived(
		captionWordsForCurrentSentence(editor.words, editor.currentWordId, editor.captionStyle)
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

	function openEmptyUploadPicker() {
		emptyUploadInput?.click();
	}

	async function handleEmptyUpload(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file || emptyUploading) return;

		emptyUploading = true;
		try {
			const uploaded = await uploadMediaForEditor(editor, project.id, file);
			trackedMediaId = uploaded.mediaId;
			editor.showMedia = true;
		} catch {
			// Network/API errors leave the empty state visible for retry.
		} finally {
			emptyUploading = false;
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<EditorLayout title={project.title} meta={topBarMeta} {editor} onback={() => goto(resolve('/'))}>
	<div class="editor-workspace" data-testid="editor-workspace">
		<div class="editor-workspace__stage">
			{#if hasTranscript}
				<div class="editor-workspace__panels">
					<TranscriptPanel
						sentences={editor.sentences}
						{speaker}
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
				<Timeline {editor} {ingestAssets} />
			{:else}
				<EmptyState
					title="No transcript yet"
					description="Upload or record footage to generate a transcript for this project."
					align="center"
					class="editor-workspace__empty"
				>
					{#snippet action()}
						<div class="editor-workspace__empty-actions">
							<button
								type="button"
								class="editor-workspace__empty-button"
								disabled={emptyUploading}
								onclick={openEmptyUploadPicker}
							>
								{emptyUploading ? 'Uploading…' : 'Upload file'}
							</button>
							<button
								type="button"
								class="editor-workspace__empty-button editor-workspace__empty-button--secondary"
								onclick={() => editor.openRecord()}
							>
								Record
							</button>
						</div>
					{/snippet}
				</EmptyState>
				<input
					bind:this={emptyUploadInput}
					class="editor-workspace__file-input"
					type="file"
					accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
					aria-hidden="true"
					tabindex={-1}
					onchange={handleEmptyUpload}
				/>
			{/if}
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

	.editor-workspace__empty-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
	}

	.editor-workspace__empty-button {
		padding: 8px 14px;
		border: 1px solid var(--border-6);
		border-radius: 8px;
		background: var(--surface-3);
		color: var(--text-3);
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.editor-workspace__empty-button--secondary {
		background: transparent;
	}

	.editor-workspace__empty-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.editor-workspace__file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.editor-workspace :global(.editor-workspace__empty) {
		flex: 1;
		justify-content: center;
		padding: 48px 24px;
	}
</style>

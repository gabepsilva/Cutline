<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import EditorLayout from '$lib/components/editor/EditorLayout.svelte';
	import EditorModals from '$lib/components/editor/EditorModals.svelte';
	import PreviewPanel from '$lib/components/editor/preview/PreviewPanel.svelte';
	import Timeline from '$lib/components/editor/timeline/Timeline.svelte';
	import TranscriptPanel from '$lib/components/editor/transcript/TranscriptPanel.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { captionWordsForCurrentSentence, trimmedLabel } from '$lib/editor/editor-derive';
	import { EditorState } from '$lib/editor/editor-state.svelte';
	import type { EditorProjectLoad } from '$lib/types/editor-load';
	import { formatTimecode } from '$lib/utils/format-timecode';
	import { resolveEditorKeyAction, shouldPreventDefault } from '$lib/utils/editor-keyboard';

	type Props = EditorProjectLoad;

	let { project, meta, words, sentences, speaker, videoUrl, resources }: Props = $props();

	const editor = $derived.by(() => new EditorState({ words, sentences, resources }));

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
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<EditorLayout title={project.title} {meta} {editor} onback={() => goto(resolve('/'))}>
	<div class="editor-workspace" data-testid="editor-workspace">
		{#if hasTranscript}
			<div class="editor-workspace__stage">
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
						{videoUrl}
						ontogglePlay={() => editor.togglePlay()}
						oncaptionstylechange={(style) => (editor.captionStyle = style)}
					/>
				</div>
				<Timeline {editor} />
				<EditorModals {editor} projectTitle={project.title} />
			</div>
		{:else}
			<EmptyState
				title="No transcript yet"
				description="Upload or record footage to generate a transcript for this project."
				align="center"
				class="editor-workspace__empty"
			/>
		{/if}
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

	.editor-workspace :global(.editor-workspace__empty) {
		flex: 1;
		justify-content: center;
		padding: 48px 24px;
	}
</style>

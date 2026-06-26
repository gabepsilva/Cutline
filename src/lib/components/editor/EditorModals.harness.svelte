<script lang="ts">
	import { EditorState } from '$lib/editor/editor-state.svelte';
	import { mockEditorResources } from '$lib/mocks/editor.mock';
	import { fixtureTranscriptWords, fixtureSentence } from '$lib/test/fixtures';
	import EditorModals from './EditorModals.svelte';

	interface Props {
		editor?: EditorState;
		projectTitle?: string;
	}

	let { editor: editorProp, projectTitle = 'Test project' }: Props = $props();

	const fallbackEditor = new EditorState({
		words: fixtureTranscriptWords.map((word) => ({ ...word })),
		sentences: [{ ...fixtureSentence, words: fixtureTranscriptWords.map((w) => ({ ...w })) }],
		resources: mockEditorResources.map((resource) => ({ ...resource }))
	});

	const editor = $derived(editorProp ?? fallbackEditor);
</script>

<div class="editor-modals-harness">
	<EditorModals {editor} projectId="proj-test" {projectTitle} />
</div>

<style>
	.editor-modals-harness {
		position: relative;
		width: 720px;
		min-height: 320px;
		--timeline-h: 0px;
	}
</style>

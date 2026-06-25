<script lang="ts">
	import { captionWords } from '$lib/editor/editor-derive';
	import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
	import type { CaptionStyle } from '$lib/types/transcript';
	import PreviewCaptions from './PreviewCaptions.svelte';

	interface Props {
		tokens?: ReturnType<typeof captionWords>;
		style?: CaptionStyle;
		visible?: boolean;
		class?: string;
	}

	let {
		tokens = captionWords(fixtureTranscriptWords, 'w1', 'karaoke'),
		style = 'karaoke',
		visible = true,
		class: className = ''
	}: Props = $props();
</script>

<PreviewCaptions {tokens} {style} {visible} class={className} />

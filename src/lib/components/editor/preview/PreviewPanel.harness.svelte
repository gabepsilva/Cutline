<script lang="ts">
	import { captionWords } from '$lib/editor/editor-derive';
	import { fixtureTranscriptWords } from '$lib/test/fixtures/transcript';
	import type { CaptionStyle } from '$lib/types/transcript';
	import PreviewPanel from './PreviewPanel.svelte';
	import type { PreviewPanelProps } from './PreviewPanel.types';

	interface Props extends Partial<PreviewPanelProps> {
		playing?: boolean;
		currentTime?: number;
		totalLabel?: string;
		savedLabel?: string;
		deletedCount?: number;
		wordCount?: number;
		captionTokens?: PreviewPanelProps['captionTokens'];
		captionStyle?: CaptionStyle;
		showCaptions?: boolean;
		recLabel?: string;
		videoUrl?: string | null;
		showSimulated?: boolean;
		ontogglePlay?: () => void;
		oncaptionstylechange?: (style: CaptionStyle) => void;
		class?: string;
	}

	let {
		playing = false,
		currentTime = 65,
		totalLabel = '4:32',
		savedLabel = '−2 words trimmed',
		deletedCount = 2,
		wordCount = 1140,
		captionTokens = captionWords(fixtureTranscriptWords, 'w1', 'karaoke'),
		captionStyle = 'karaoke',
		showCaptions = true,
		recLabel = 'REC 1080p',
		videoUrl = null,
		showSimulated = true,
		ontogglePlay,
		oncaptionstylechange,
		class: className = ''
	}: Props = $props();
</script>

<div class="preview-panel-harness">
	<PreviewPanel
		{playing}
		{currentTime}
		{totalLabel}
		{savedLabel}
		{deletedCount}
		{wordCount}
		{captionTokens}
		{captionStyle}
		{showCaptions}
		{recLabel}
		{videoUrl}
		{showSimulated}
		{ontogglePlay}
		{oncaptionstylechange}
		class={className}
	/>
</div>

<style>
	.preview-panel-harness {
		width: 640px;
		min-height: 520px;
	}
</style>

<script lang="ts">
	import CaptionStylePicker from './CaptionStylePicker.svelte';
	import PreviewCaptions from './PreviewCaptions.svelte';
	import PreviewPlayer from './PreviewPlayer.svelte';
	import PreviewStats from './PreviewStats.svelte';
	import type { PreviewPanelProps } from './PreviewPanel.types';

	let {
		playing,
		currentTime,
		totalLabel,
		savedLabel,
		deletedCount,
		wordCount,
		captionTokens = [],
		captionStyle = 'karaoke',
		showCaptions = true,
		recLabel = 'REC 1080p',
		videoUrl = null,
		showSimulated = true,
		ontogglePlay,
		oncaptionstylechange,
		class: className = ''
	}: PreviewPanelProps = $props();
</script>

<section class={['preview-panel', className]} aria-label="Preview">
	<PreviewPlayer {playing} {currentTime} {recLabel} {videoUrl} {showSimulated} {ontogglePlay}>
		{#snippet captions()}
			<PreviewCaptions tokens={captionTokens} style={captionStyle} visible={showCaptions} />
		{/snippet}
	</PreviewPlayer>

	<PreviewStats {totalLabel} {savedLabel} {deletedCount} {wordCount} class="preview-panel__stats" />

	<CaptionStylePicker
		value={captionStyle}
		onchange={oncaptionstylechange}
		class="preview-panel__caption-style"
	/>
</section>

<style>
	.preview-panel {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		background: var(--surface-0);
		padding: 22px;
		overflow-y: auto;
	}

	.preview-panel :global(.preview-panel__stats) {
		margin-top: 16px;
	}

	.preview-panel :global(.preview-panel__caption-style) {
		margin-top: 12px;
	}
</style>

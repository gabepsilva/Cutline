<script lang="ts">
	import PreviewPlayer from './PreviewPlayer.svelte';

	interface Props {
		playing?: boolean;
		currentTime?: number;
		recLabel?: string;
		videoUrl?: string | null;
		showSimulated?: boolean;
		ontogglePlay?: () => void;
		class?: string;
	}

	let {
		playing = false,
		currentTime = 65,
		recLabel = 'REC 1080p',
		videoUrl = null,
		showSimulated = true,
		ontogglePlay,
		class: className = ''
	}: Props = $props();
</script>

<div class="preview-player-harness">
	<PreviewPlayer
		{playing}
		{currentTime}
		{recLabel}
		{videoUrl}
		{showSimulated}
		{ontogglePlay}
		class={className}
	/>
</div>

<style>
	.preview-player-harness {
		width: 640px;
	}
</style>

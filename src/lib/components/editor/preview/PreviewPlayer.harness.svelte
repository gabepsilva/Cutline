<script lang="ts">
	import PreviewPlayer from './PreviewPlayer.svelte';

	interface Props {
		playing?: boolean;
		currentTime?: number;
		sourceTime?: number | null;
		recLabel?: string;
		videoUrl?: string | null;
		showSimulated?: boolean;
		ontogglePlay?: () => void;
		class?: string;
	}

	let {
		playing = false,
		currentTime = 65,
		sourceTime = null,
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
		{sourceTime}
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

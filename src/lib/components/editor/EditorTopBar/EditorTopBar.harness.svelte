<script lang="ts">
	import EditorTopBar from './EditorTopBar.svelte';

	interface Props {
		title?: string;
		meta?: string;
		transcribing?: boolean;
		transcriptionProgress?: number;
		playing?: boolean;
		current?: number;
		total?: number;
		onback?: () => void;
		ontogglePlay?: () => void;
		onexport?: () => void;
	}

	let {
		title = 'How I edit videos 3x faster',
		meta = 'Auto-saved · MP4 1080p',
		transcribing = false,
		transcriptionProgress = 0,
		playing = false,
		current = 65,
		total = 272,
		onback,
		ontogglePlay,
		onexport
	}: Props = $props();
</script>

<EditorTopBar
	{title}
	{meta}
	{transcribing}
	{transcriptionProgress}
	{playing}
	{current}
	{total}
	{onback}
	{ontogglePlay}
	{onexport}
/>

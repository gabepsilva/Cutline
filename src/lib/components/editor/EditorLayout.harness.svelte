<script lang="ts">
	import EditorLayout from './EditorLayout.svelte';

	interface Props {
		title?: string;
		meta?: string;
		slotContent?: string;
	}

	let {
		title = 'How I edit videos 3x faster',
		meta = 'Auto-saved · MP4 1080p',
		slotContent = 'Editor workspace'
	}: Props = $props();
</script>

<EditorLayout {title} {meta}>
	<p>{slotContent}</p>
</EditorLayout>

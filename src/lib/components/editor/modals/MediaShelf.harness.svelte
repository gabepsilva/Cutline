<script lang="ts">
	import MediaShelf from './MediaShelf.svelte';
	import { mockMediaResources } from '$lib/mocks/media.mock';
	import type { MediaResource } from '$lib/types/media';

	interface Props {
		open?: boolean;
		resources?: MediaResource[];
		onclose?: () => void;
		onrecord?: () => void;
		onresourceclick?: (resource: MediaResource) => void;
		class?: string;
	}

	let {
		open = true,
		resources = mockMediaResources,
		onclose,
		onrecord,
		onresourceclick,
		class: className = ''
	}: Props = $props();
</script>

<div class="media-shelf-harness">
	<MediaShelf {open} {resources} {onclose} {onrecord} {onresourceclick} class={className} />
</div>

<style>
	.media-shelf-harness {
		position: relative;
		width: 720px;
		height: 220px;
		--timeline-h: 0px;
	}
</style>

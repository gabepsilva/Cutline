<script lang="ts">
	import MediaCard from './MediaCard.svelte';
	import { fixtureMediaResource } from '$lib/test/fixtures/media-resource';
	import type { MediaResource } from '$lib/types/media';

	interface Props {
		resource?: MediaResource;
		onclick?: () => void;
		class?: string;
	}

	let { resource = fixtureMediaResource, onclick, class: className = '' }: Props = $props();
</script>

<MediaCard {resource} {onclick} class={className} />

<script lang="ts">
	import RecordReview from './RecordReview.svelte';
	import { DEFAULT_RECORD_THUMB } from '$lib/types/media';

	interface Props {
		name?: string;
		durationLabel?: string;
		thumb?: string;
		onkeep?: () => void;
		onaddtotimeline?: () => void;
		class?: string;
	}

	let {
		name = 'New recording',
		durationLabel = '0:12',
		thumb = DEFAULT_RECORD_THUMB,
		onkeep,
		onaddtotimeline,
		class: className = ''
	}: Props = $props();
</script>

<RecordReview {name} {durationLabel} {thumb} {onkeep} {onaddtotimeline} class={className} />

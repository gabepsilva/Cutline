<script lang="ts">
	import RecordReview from './RecordReview.svelte';

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
		thumb = 'repeating-linear-gradient(135deg,#161619 0 14px,#121215 14px 28px)',
		onkeep,
		onaddtotimeline,
		class: className = ''
	}: Props = $props();
</script>

<RecordReview {name} {durationLabel} {thumb} {onkeep} {onaddtotimeline} class={className} />

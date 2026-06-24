<script lang="ts">
	import RecordPreview from './RecordPreview.svelte';

	interface Props {
		recording?: boolean;
		countingDown?: boolean;
		countdown?: number;
		elapsedLabel?: string;
		simulated?: boolean;
		class?: string;
	}

	let {
		recording = false,
		countingDown = false,
		countdown = 3,
		elapsedLabel = '0:00',
		simulated = true,
		class: className = ''
	}: Props = $props();
</script>

<div class="record-preview-harness">
	<RecordPreview
		{recording}
		{countingDown}
		{countdown}
		{elapsedLabel}
		{simulated}
		class={className}
	/>
</div>

<style>
	.record-preview-harness {
		width: 480px;
	}
</style>

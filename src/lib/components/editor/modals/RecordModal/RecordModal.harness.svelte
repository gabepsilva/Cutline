<script lang="ts">
	import RecordModal from './RecordModal.svelte';
	import type { RecordModalStep, RecordSource } from '../RecordModal.types';

	interface Props {
		open?: boolean;
		step?: RecordModalStep;
		source?: RecordSource;
		recording?: boolean;
		countingDown?: boolean;
		countdown?: number;
		elapsedLabel?: string;
		reviewName?: string;
		reviewDurationLabel?: string;
		reviewThumb?: string;
		onclose?: () => void;
		onsourcechange?: (source: RecordSource) => void;
		onstart?: () => void;
		onstop?: () => void;
		onkeep?: () => void;
		onaddtotimeline?: () => void;
		class?: string;
	}

	let {
		open = true,
		step = 'preview',
		source = 'camera',
		recording = false,
		countingDown = false,
		countdown = 3,
		elapsedLabel = '0:00',
		reviewName = 'New recording',
		reviewDurationLabel = '0:12',
		reviewThumb = 'repeating-linear-gradient(135deg,#161619 0 14px,#121215 14px 28px)',
		onclose,
		onsourcechange,
		onstart,
		onstop,
		onkeep,
		onaddtotimeline,
		class: className = ''
	}: Props = $props();
</script>

<RecordModal
	{open}
	{step}
	{source}
	{recording}
	{countingDown}
	{countdown}
	{elapsedLabel}
	{reviewName}
	{reviewDurationLabel}
	{reviewThumb}
	{onclose}
	{onsourcechange}
	{onstart}
	{onstop}
	{onkeep}
	{onaddtotimeline}
	class={className}
/>

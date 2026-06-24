<script lang="ts">
	import { formatTimecode } from '$lib/utils/format-timecode';
	import type { TimecodeDisplaySize } from './TimecodeDisplay.types';

	interface Props {
		current: number;
		total?: number;
		size?: TimecodeDisplaySize;
		class?: string;
	}

	let { current, total, size = 'md', class: className = '' }: Props = $props();

	const currentLabel = $derived(formatTimecode(current));
	const totalLabel = $derived(total === undefined ? undefined : formatTimecode(total));
</script>

<span class={['timecode-display', `timecode-display--${size}`, className]}>
	<span class="timecode-display__current">{currentLabel}</span>
	{#if totalLabel !== undefined}
		<span class="timecode-display__separator" aria-hidden="true"> / </span>
		<span class="timecode-display__total">{totalLabel}</span>
	{/if}
</span>

<style>
	.timecode-display {
		font-family: var(--font-mono);
		color: var(--text-2);
		white-space: nowrap;
	}

	.timecode-display--sm {
		font-size: 11px;
	}

	.timecode-display--md {
		font-size: 12.5px;
	}

	.timecode-display__total {
		color: var(--text-8);
	}
</style>

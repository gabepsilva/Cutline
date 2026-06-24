<script lang="ts">
	import TimecodeDisplay from './TimecodeDisplay.svelte';
	import type { TimecodeDisplaySize } from './TimecodeDisplay.types';

	interface Props {
		current?: number;
		total?: number;
		size?: TimecodeDisplaySize;
		class?: string;
	}

	let { current = 65, total, size = 'md', class: className = '' }: Props = $props();
</script>

<TimecodeDisplay {current} {total} {size} class={className} />

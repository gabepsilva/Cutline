<script lang="ts">
	import Chip from './Chip.svelte';

	interface Props {
		label?: string;
		selected?: boolean;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		label = 'Karaoke',
		selected = false,
		disabled = false,
		onclick,
		class: className = ''
	}: Props = $props();
</script>

<Chip {selected} {disabled} {onclick} class={className}>
	{label}
</Chip>

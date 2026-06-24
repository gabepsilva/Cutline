<script lang="ts">
	import Toggle from './Toggle.svelte';
	import type { ToggleSize } from './Toggle.types';

	interface Props {
		checked?: boolean;
		label?: string;
		size?: ToggleSize;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
		class?: string;
	}

	let {
		checked = false,
		label = 'Snap',
		size = 'md',
		disabled = false,
		onchange,
		class: className = ''
	}: Props = $props();
</script>

<Toggle {checked} {label} {size} {disabled} {onchange} class={className} />

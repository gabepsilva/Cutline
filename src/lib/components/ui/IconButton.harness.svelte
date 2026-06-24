<script lang="ts">
	import IconButton from './IconButton.svelte';
	import type { IconButtonSize, IconButtonVariant } from './IconButton.types';

	interface Props {
		label: string;
		variant?: IconButtonVariant;
		size?: IconButtonSize;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		label,
		variant = 'ghost',
		size = 'md',
		disabled = false,
		onclick,
		class: className = ''
	}: Props = $props();
</script>

<IconButton {label} {variant} {size} {disabled} {onclick} class={className}>
	<span aria-hidden="true">×</span>
</IconButton>

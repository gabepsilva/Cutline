<script lang="ts">
	import Button from './Button.svelte';
	import type { ButtonSize, ButtonVariant } from './Button.types';

	interface Props {
		label?: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (event: MouseEvent) => void;
		class?: string;
	}

	let {
		label = 'Export',
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		class: className = ''
	}: Props = $props();
</script>

<Button {variant} {size} {disabled} {type} {onclick} class={className}>
	{label}
</Button>

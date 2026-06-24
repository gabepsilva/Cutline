<script lang="ts">
	import IconButton from './IconButton.svelte';
	import type { IconButtonSize, IconButtonVariant } from './IconButton.types';

	interface Props {
		label: string;
		variant?: IconButtonVariant;
		size?: IconButtonSize;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let { label, variant = 'ghost', size = 'md', disabled = false, onclick }: Props = $props();
</script>

<IconButton {label} {variant} {size} {disabled} {onclick}>
	<span aria-hidden="true">×</span>
</IconButton>

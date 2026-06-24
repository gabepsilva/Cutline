<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { IconButtonSize, IconButtonVariant } from './IconButton.types';

	interface Props {
		label: string;
		variant?: IconButtonVariant;
		size?: IconButtonSize;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	}

	let {
		label,
		variant = 'ghost',
		size = 'md',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();
</script>

<button
	type="button"
	aria-label={label}
	{disabled}
	class={['icon-button', `icon-button--${variant}`, `icon-button--${size}`, className]}
	{onclick}
>
	{@render children()}
</button>

<style>
	.icon-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		padding: 0;
		border: 1px solid transparent;
		background: transparent;
		font-family: inherit;
		line-height: 1;
		cursor: pointer;
		transition:
			opacity 0.15s,
			background-color 0.15s,
			border-color 0.15s;
	}

	.icon-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.icon-button--ghost {
		color: var(--text-4);
	}

	.icon-button--primary {
		background: var(--accent);
		color: var(--on-accent);
		border-radius: var(--radius-md);
	}

	.icon-button--bordered {
		color: var(--text-6);
		border-color: var(--border-6);
		border-radius: var(--radius-sm);
	}

	.icon-button--sm {
		width: 24px;
		height: 24px;
	}

	.icon-button--md {
		width: 30px;
		height: 30px;
	}

	.icon-button--lg {
		width: 38px;
		height: 38px;
	}
</style>

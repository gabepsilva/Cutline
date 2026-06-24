<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ButtonSize, ButtonVariant } from './Button.types';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		onclick,
		class: className = '',
		children
	}: Props = $props();
</script>

<button
	{type}
	{disabled}
	class={['button', `button--${variant}`, `button--${size}`, className]}
	{onclick}
>
	{@render children()}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid transparent;
		font-family: inherit;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		border-radius: var(--radius-md);
		transition:
			opacity 0.15s,
			background-color 0.15s,
			border-color 0.15s;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button--primary {
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
	}

	.button--secondary {
		background: var(--surface-6);
		border-color: var(--border-6);
		color: var(--text-3);
	}

	.button--ghost {
		background: transparent;
		color: var(--text-5);
	}

	.button--accent-outline {
		background: var(--accent-tint-08);
		border-color: var(--accent-tint-32);
		color: var(--accent);
	}

	.button--danger {
		background: var(--danger-tint-12);
		border-color: var(--danger-tint-42);
		color: var(--danger-text);
	}

	.button--sm {
		font-size: 12px;
		padding: 6px 11px;
		border-radius: var(--radius-sm);
	}

	.button--md {
		font-size: 13px;
		padding: 9px 17px;
	}

	.button--lg {
		font-size: 13.5px;
		padding: 11px 18px;
		border-radius: var(--radius-lg);
	}
</style>

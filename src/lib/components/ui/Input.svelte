<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { InputSize } from './Input.types';

	interface Props {
		value?: string;
		placeholder?: string;
		label: string;
		disabled?: boolean;
		size?: InputSize;
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		class?: string;
		icon?: Snippet;
	}

	let {
		value = '',
		placeholder = '',
		label,
		disabled = false,
		size = 'md',
		oninput,
		class: className = '',
		icon
	}: Props = $props();
</script>

<div class={['input', `input--${size}`, className]}>
	{#if icon}
		<span class="input__icon" aria-hidden="true">
			{@render icon()}
		</span>
	{/if}
	<input
		type="search"
		class="input__field"
		{value}
		{placeholder}
		{disabled}
		aria-label={label}
		{oninput}
	/>
</div>

<style>
	.input {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--surface-6);
		border: 1px solid var(--border-5);
		border-radius: var(--radius-md);
		padding: 6px 10px;
		width: 100%;
	}

	.input--md {
		font-size: 12.5px;
	}

	.input__icon {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--text-8);
	}

	.input__field {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--text-1);
		font: inherit;
		padding: 0;
	}

	.input__field::placeholder {
		color: var(--text-placeholder);
	}

	.input__field:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

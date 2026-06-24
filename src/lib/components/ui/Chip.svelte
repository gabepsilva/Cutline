<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		selected?: boolean;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children: Snippet;
	}

	let {
		selected = false,
		disabled = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();
</script>

<button
	type="button"
	aria-pressed={selected}
	{disabled}
	class={['chip', selected && 'chip--selected', className]}
	{onclick}
>
	{@render children()}
</button>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 7px 14px;
		border: 1px solid var(--border-6);
		border-radius: var(--radius-md);
		background: var(--surface-7);
		color: var(--text-5);
		font-family: inherit;
		font-size: 12.5px;
		font-weight: 500;
		line-height: 1.2;
		cursor: pointer;
		transition:
			opacity 0.15s,
			background-color 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.chip:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.chip--selected {
		background: var(--accent-tint-12);
		border-color: var(--accent);
		color: var(--text-1);
	}
</style>

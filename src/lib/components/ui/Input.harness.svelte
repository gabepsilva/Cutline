<script lang="ts">
	import Input from './Input.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		label?: string;
		disabled?: boolean;
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		showIcon?: boolean;
	}

	let {
		value = '',
		placeholder = 'Search transcript',
		label = 'Search transcript',
		disabled = false,
		oninput,
		showIcon = true
	}: Props = $props();
</script>

<Input {value} {placeholder} {label} {disabled} {oninput}>
	{#snippet icon()}
		{#if showIcon}
			<span class="search-icon" aria-hidden="true"></span>
		{/if}
	{/snippet}
</Input>

<style>
	.search-icon {
		display: block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1.5px solid currentColor;
		position: relative;
	}

	.search-icon::after {
		content: '';
		position: absolute;
		right: -4px;
		bottom: -3px;
		width: 5px;
		height: 1.5px;
		background: currentColor;
		transform: rotate(45deg);
	}
</style>

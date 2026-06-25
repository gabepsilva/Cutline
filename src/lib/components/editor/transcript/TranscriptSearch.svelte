<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void;
		class?: string;
	}

	let {
		value = '',
		placeholder = 'Search transcript',
		disabled = false,
		oninput,
		class: className = ''
	}: Props = $props();
</script>

<div class={['transcript-search', className]}>
	<Input {value} {placeholder} label={placeholder} {disabled} {oninput}>
		{#snippet icon()}
			<span class="transcript-search__icon" aria-hidden="true"></span>
		{/snippet}
	</Input>
</div>

<style>
	.transcript-search {
		flex: 1;
		max-width: 260px;
		min-width: 0;
	}

	.transcript-search__icon {
		display: block;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1.5px solid currentColor;
		position: relative;
	}

	.transcript-search__icon::after {
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

<script lang="ts">
	import TranscriptSearch from './TranscriptSearch.svelte';

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

<TranscriptSearch {value} {placeholder} {disabled} {oninput} class={className} />

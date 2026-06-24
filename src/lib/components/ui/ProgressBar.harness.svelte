<script lang="ts">
	import ProgressBar from './ProgressBar.svelte';

	interface Props {
		value?: number;
		label?: string;
		class?: string;
	}

	let { value = 62, label, class: className = '' }: Props = $props();
</script>

<ProgressBar {value} {label} class={className} />

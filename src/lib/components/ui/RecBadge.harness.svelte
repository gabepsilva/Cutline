<script lang="ts">
	import RecBadge from './RecBadge.svelte';

	interface Props {
		label?: string;
		class?: string;
	}

	let { label = 'REC', class: className = '' }: Props = $props();
</script>

<RecBadge {label} class={className} />

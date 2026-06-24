<script lang="ts">
	import EmptyState from './EmptyState.svelte';
	import type { EmptyStateAlign } from './EmptyState.types';

	interface Props {
		title?: string;
		description?: string;
		align?: EmptyStateAlign;
	}

	let {
		title = 'Record or add B-roll — clips drop here at the playhead',
		description,
		align = 'start'
	}: Props = $props();
</script>

<EmptyState {title} {description} {align} />

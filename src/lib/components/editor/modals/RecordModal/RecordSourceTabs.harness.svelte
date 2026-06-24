<script lang="ts">
	import RecordSourceTabs from './RecordSourceTabs.svelte';
	import type { RecordSource } from '../RecordModal.types';

	interface Props {
		selected?: RecordSource;
		onselect?: (source: RecordSource) => void;
		class?: string;
	}

	let { selected = 'camera', onselect, class: className = '' }: Props = $props();
</script>

<RecordSourceTabs {selected} {onselect} class={className} />

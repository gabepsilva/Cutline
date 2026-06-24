<script lang="ts">
	import EditorIconRail from './EditorIconRail.svelte';
	import type { EditorRailItem } from './EditorIconRail.types';

	interface Props {
		onitemclick?: (item: EditorRailItem, event: MouseEvent) => void;
	}

	let { onitemclick }: Props = $props();
</script>

<EditorIconRail {onitemclick} />

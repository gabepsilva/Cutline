<script lang="ts">
	import PreviewStats from './PreviewStats.svelte';
	import type { PreviewStatsProps } from './PreviewStats.types';

	let {
		totalLabel = '4:32',
		savedLabel = '−2 words trimmed',
		deletedCount = 2,
		wordCount = 1140,
		class: className = ''
	}: PreviewStatsProps = $props();
</script>

<PreviewStats {totalLabel} {savedLabel} {deletedCount} {wordCount} class={className} />

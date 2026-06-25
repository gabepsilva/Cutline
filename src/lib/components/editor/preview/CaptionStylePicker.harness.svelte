<script lang="ts">
	import type { CaptionStyle } from '$lib/types/transcript';
	import CaptionStylePicker from './CaptionStylePicker.svelte';

	interface Props {
		value?: CaptionStyle;
		onchange?: (style: CaptionStyle) => void;
		class?: string;
	}

	let { value = 'karaoke', onchange, class: className = '' }: Props = $props();
</script>

<CaptionStylePicker {value} {onchange} class={className} />

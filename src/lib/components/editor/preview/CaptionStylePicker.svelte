<script lang="ts">
	import Chip from '$lib/components/ui/Chip.svelte';
	import type { CaptionStyle } from '$lib/types/transcript';
	import type { CaptionStylePickerProps } from './CaptionStylePicker.types';

	let { value = 'karaoke', onchange, class: className = '' }: CaptionStylePickerProps = $props();

	function select(style: CaptionStyle) {
		onchange?.(style);
	}
</script>

<section class={['caption-style-picker', className]} aria-label="Caption style">
	<p class="caption-style-picker__label">Caption style</p>
	<div class="caption-style-picker__options" role="group" aria-label="Caption style options">
		<Chip selected={value === 'karaoke'} onclick={() => select('karaoke')}>Karaoke</Chip>
		<Chip selected={value === 'clean'} onclick={() => select('clean')}>Clean</Chip>
	</div>
</section>

<style>
	.caption-style-picker {
		padding: 13px 15px;
		background: var(--surface-4);
		border: 1px solid var(--border-4);
		border-radius: 11px;
	}

	.caption-style-picker__label {
		margin: 0 0 9px;
		font-size: 10.5px;
		color: var(--text-6);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.caption-style-picker__options {
		display: flex;
		gap: 8px;
	}
</style>

<script lang="ts">
	import {
		filmstripBackgroundPosition,
		filmstripFramesFromEdl,
		type FilmstripFrame
	} from '$lib/editor/waveform';
	import { formatPercent } from '$lib/types/timeline';
	import type { FilmstripMeta } from '$lib/types/ingest-assets';
	import type { Word } from '$lib/types/transcript';

	interface Props {
		words: Word[];
		filmstripUrl: string;
		meta: FilmstripMeta;
		class?: string;
	}

	let { words, filmstripUrl, meta, class: className = '' }: Props = $props();

	const frames = $derived(filmstripFramesFromEdl(words, meta));

	function frameStyle(frame: FilmstripFrame) {
		const position = filmstripBackgroundPosition(meta, frame.frameIndex);
		return {
			left: formatPercent(frame.leftPct),
			width: formatPercent(frame.widthPct),
			backgroundImage: `url(${filmstripUrl})`,
			backgroundSize: `${meta.cols * 100}% ${meta.rows * 100}%`,
			backgroundPosition: `${position.xPct}% ${position.yPct}%`
		};
	}
</script>

<div class={['timeline-filmstrip', className]} aria-hidden="true">
	{#each frames as frame, index (`${frame.leftPct}-${frame.frameIndex}-${index}`)}
		<div
			class="timeline-filmstrip__frame"
			style:left={frameStyle(frame).left}
			style:width={frameStyle(frame).width}
			style:background-image={frameStyle(frame).backgroundImage}
			style:background-size={frameStyle(frame).backgroundSize}
			style:background-position={frameStyle(frame).backgroundPosition}
		></div>
	{/each}
</div>

<style>
	.timeline-filmstrip {
		position: absolute;
		inset: 0;
	}

	.timeline-filmstrip__frame {
		position: absolute;
		top: 5px;
		bottom: 5px;
		border-radius: var(--radius-xs);
		border: 1px solid var(--border-7);
		background-repeat: no-repeat;
		overflow: hidden;
	}
</style>

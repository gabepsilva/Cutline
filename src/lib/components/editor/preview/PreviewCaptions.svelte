<script lang="ts">
	import type { PreviewCaptionsProps } from './PreviewCaptions.types';

	let {
		tokens = [],
		style = 'karaoke',
		visible = true,
		class: className = ''
	}: PreviewCaptionsProps = $props();
</script>

{#if visible && tokens.length > 0}
	<div class={['preview-captions', className]} aria-live="polite">
		<p class={['preview-captions__text', style === 'clean' && 'preview-captions__text--clean']}>
			{#each tokens as token (token.id)}
				<span
					class={[
						'preview-captions__word',
						style === 'karaoke' && token.isCurrent && 'preview-captions__word--current',
						style === 'karaoke' && !token.isCurrent && 'preview-captions__word--dimmed'
					]}>{token.display}</span
				>
			{/each}
		</p>
	</div>
{/if}

<style>
	.preview-captions {
		display: flex;
		justify-content: center;
		width: 100%;
		padding: 0 26px;
		pointer-events: none;
	}

	.preview-captions__text {
		max-width: 88%;
		margin: 0;
		text-align: center;
		font-size: 19px;
		font-weight: 600;
		line-height: 1.4;
		letter-spacing: -0.01em;
		text-shadow: 0 2px 14px rgb(0 0 0 / 85%);
	}

	.preview-captions__text--clean .preview-captions__word {
		color: var(--text-bright);
	}

	.preview-captions__word {
		transition: color 0.12s;
	}

	.preview-captions__word--current {
		color: var(--accent);
	}

	.preview-captions__word--dimmed {
		color: rgb(255 255 255 / 55%);
	}
</style>

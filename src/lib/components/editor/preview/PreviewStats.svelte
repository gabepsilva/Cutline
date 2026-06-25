<script lang="ts">
	import type { PreviewStatsProps } from './PreviewStats.types';

	let {
		totalLabel,
		savedLabel,
		deletedCount,
		wordCount,
		class: className = ''
	}: PreviewStatsProps = $props();
</script>

<div class={['preview-stats', className]}>
	<div class="preview-stats__card">
		<p class="preview-stats__label">Clip length</p>
		<p class="preview-stats__value" aria-label="Clip length">{totalLabel}</p>
		<p class="preview-stats__detail preview-stats__detail--accent">{savedLabel}</p>
	</div>

	<div class="preview-stats__card">
		<p class="preview-stats__label">Edits</p>
		<p class="preview-stats__value" aria-label="Deleted word count">
			{deletedCount}
			<span class="preview-stats__unit">cut</span>
		</p>
		<p class="preview-stats__detail">{wordCount} words remain</p>
	</div>
</div>

<style>
	.preview-stats {
		display: flex;
		gap: 10px;
	}

	.preview-stats__card {
		flex: 1;
		background: var(--surface-4);
		border: 1px solid var(--border-4);
		border-radius: 11px;
		padding: 13px 15px;
	}

	.preview-stats__label {
		margin: 0 0 7px;
		font-size: 10.5px;
		color: var(--text-6);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.preview-stats__value {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 19px;
		color: var(--text-1);
		line-height: 1.2;
	}

	.preview-stats__unit {
		font-size: 12px;
		color: var(--text-6);
	}

	.preview-stats__detail {
		margin: 5px 0 0;
		font-size: 11px;
		color: var(--text-5);
	}

	.preview-stats__detail--accent {
		color: var(--accent);
	}
</style>

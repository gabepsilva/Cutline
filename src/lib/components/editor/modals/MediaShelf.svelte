<script lang="ts">
	import type { MediaResource } from '$lib/types/media';
	import MediaCard from './MediaCard.svelte';

	interface Props {
		open: boolean;
		resources: MediaResource[];
		uploadProgress?: number | null;
		uploading?: boolean;
		onclose?: () => void;
		onrecord?: () => void;
		onupload?: (file: File) => void;
		onresourceclick?: (resource: MediaResource) => void;
		class?: string;
	}

	let {
		open,
		resources,
		uploadProgress = null,
		uploading = false,
		onclose,
		onrecord,
		onupload,
		onresourceclick,
		class: className = ''
	}: Props = $props();

	let fileInput = $state<HTMLInputElement | null>(null);

	function openFilePicker() {
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) {
			onupload?.(file);
		}
	}
</script>

{#if open}
	<section class={['media-shelf', className]} aria-label="Media library">
		<header class="media-shelf__header">
			<h2 class="media-shelf__title">Media library</h2>
			<p class="media-shelf__hint">Click a clip to drop it on the B-roll track at the playhead</p>
			<button
				type="button"
				class="media-shelf__close"
				aria-label="Close media library"
				onclick={onclose}
			>
				<span aria-hidden="true">✕</span>
			</button>
		</header>

		{#if uploading}
			<p class="media-shelf__upload-status" role="status">
				Uploading… {Math.round((uploadProgress ?? 0) * 100)}%
			</p>
		{/if}

		<div class="media-shelf__row">
			<button type="button" class="media-shelf__record" onclick={onrecord}>
				<span class="media-shelf__record-icon" aria-hidden="true">
					<span class="media-shelf__record-dot"></span>
				</span>
				<span class="media-shelf__record-label">Record new</span>
			</button>

			<button
				type="button"
				class="media-shelf__upload"
				disabled={uploading}
				onclick={openFilePicker}
			>
				<span class="media-shelf__upload-icon" aria-hidden="true">↑</span>
				<span class="media-shelf__upload-label">Upload file</span>
			</button>
			<input
				bind:this={fileInput}
				class="media-shelf__file-input"
				type="file"
				accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
				aria-hidden="true"
				tabindex={-1}
				onchange={handleFileChange}
			/>

			{#each resources as resource (resource.id)}
				<MediaCard {resource} onclick={() => onresourceclick?.(resource)} />
			{/each}
		</div>
	</section>
{/if}

<style>
	.media-shelf {
		position: absolute;
		left: 60px;
		right: 18px;
		bottom: var(--timeline-h);
		z-index: var(--z-media-shelf);
		display: flex;
		flex-direction: column;
		gap: 11px;
		padding: 14px 16px;
		background: var(--surface-4);
		border: 1px solid var(--border-7);
		border-radius: 14px;
		box-shadow: var(--shadow-shelf);
	}

	.media-shelf__header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.media-shelf__title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-1);
	}

	.media-shelf__hint {
		margin: 0;
		font-size: 11px;
		color: var(--text-7);
	}

	.media-shelf__upload-status {
		margin: 0;
		font-size: 11px;
		color: var(--text-5);
	}

	.media-shelf__close {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: 1px solid var(--border-6);
		border-radius: 6px;
		background: transparent;
		color: var(--text-6);
		font-size: 11px;
		cursor: pointer;
	}

	.media-shelf__row {
		display: flex;
		gap: 11px;
		overflow-x: auto;
		padding-bottom: 3px;
	}

	.media-shelf__record,
	.media-shelf__upload {
		flex: 0 0 150px;
		width: 150px;
		min-height: 128px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 9px;
		padding: 0;
		border-radius: 10px;
		background: transparent;
		color: var(--text-5);
		font-family: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.media-shelf__record {
		border: 1px dashed var(--text-placeholder);
	}

	.media-shelf__upload {
		border: 1px dashed var(--border-6);
	}

	.media-shelf__upload:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.media-shelf__record-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: var(--radius-pill);
		background: var(--danger-tint-14);
		border: 1px solid var(--danger-tint-45);
	}

	.media-shelf__record-dot {
		width: 13px;
		height: 13px;
		border-radius: var(--radius-pill);
		background: var(--danger);
	}

	.media-shelf__upload-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: var(--radius-pill);
		background: var(--surface-3);
		border: 1px solid var(--border-6);
		font-size: 16px;
		line-height: 1;
	}

	.media-shelf__file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>

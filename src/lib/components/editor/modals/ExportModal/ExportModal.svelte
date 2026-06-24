<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Chip from '$lib/components/ui/Chip.svelte';
	import Modal from '$lib/components/ui/Modal/Modal.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import type { ExportFormat, ExportResolution } from '../ExportModal.types';

	interface Props {
		open: boolean;
		format?: ExportFormat;
		resolution?: ExportResolution;
		burnCaptions?: boolean;
		totalTimecode: string;
		onclose?: () => void;
		onformatchange?: (format: ExportFormat) => void;
		onresolutionchange?: (resolution: ExportResolution) => void;
		onburncaptionschange?: (enabled: boolean) => void;
		onexport?: () => void;
		class?: string;
	}

	let {
		open,
		format = 'mp4',
		resolution = '1080p',
		burnCaptions = true,
		totalTimecode,
		onclose,
		onformatchange,
		onresolutionchange,
		onburncaptionschange,
		onexport,
		class: className = ''
	}: Props = $props();

	const formats: { id: ExportFormat; label: string }[] = [
		{ id: 'mp4', label: 'MP4' },
		{ id: 'mov', label: 'MOV' },
		{ id: 'gif', label: 'GIF' }
	];

	const resolutions: { id: ExportResolution; label: string }[] = [
		{ id: '720p', label: '720p' },
		{ id: '1080p', label: '1080p' },
		{ id: '4k', label: '4K' }
	];
</script>

<Modal {open} title="Export video" layer="export" {onclose} class={className}>
	<div class="export-modal">
			<p class="export-modal__section-label">Format</p>
			<div class="export-modal__chips" role="group" aria-label="Export format">
				{#each formats as item (item.id)}
					<Chip selected={format === item.id} onclick={() => onformatchange?.(item.id)}>
						{item.label}
					</Chip>
				{/each}
			</div>

			<p class="export-modal__section-label">Resolution</p>
			<div class="export-modal__chips" role="group" aria-label="Export resolution">
				{#each resolutions as item (item.id)}
					<Chip selected={resolution === item.id} onclick={() => onresolutionchange?.(item.id)}>
						{item.label}
					</Chip>
				{/each}
			</div>

			<div class="export-modal__toggle-row">
				<div>
					<p class="export-modal__toggle-title">Burn in captions</p>
					<p class="export-modal__toggle-detail">Render subtitles into the video</p>
				</div>
				<Toggle label="Burn in captions" checked={burnCaptions} onchange={onburncaptionschange} />
			</div>

			<Button variant="primary" size="lg" class="export-modal__submit" onclick={onexport}>
				Export · {totalTimecode}
			</Button>
	</div>
</Modal>

<style>
	.export-modal__section-label {
		margin: 0 0 9px;
		font-size: 11px;
		color: var(--text-7);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.export-modal__chips {
		display: flex;
		gap: 8px;
		margin-bottom: 18px;
	}

	.export-modal__chips :global(.chip) {
		flex: 1;
		padding: 10px;
		font-size: 13px;
	}

	.export-modal__toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 13px 15px;
		margin-bottom: 22px;
		background: var(--surface-4);
		border: 1px solid var(--border-4);
		border-radius: 10px;
	}

	.export-modal__toggle-title {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-3);
	}

	.export-modal__toggle-detail {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--text-7);
	}

	:global(.export-modal__submit.button) {
		width: 100%;
		padding: 13px;
		font-size: 14px;
		border-radius: 10px;
	}
</style>

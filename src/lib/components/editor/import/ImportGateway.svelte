<script lang="ts">
	import { onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import { uploadImportMedia } from '$lib/editor/media-upload';
	import { formatBytes } from '$lib/utils/format-bytes';
	import type { ImportGatewayMode, ImportUploadFile } from './ImportGateway.types';

	interface Props {
		projectId?: string | null;
		projectTitle: string;
		onrecord?: () => void;
		onprojectcreated?: (projectId: string) => void;
		onbatchcomplete?: () => void;
	}

	let {
		projectId = null,
		projectTitle,
		onrecord,
		onprojectcreated,
		onbatchcomplete
	}: Props = $props();

	let mode = $state<ImportGatewayMode>('idle');
	let files = $state<ImportUploadFile[]>([]);
	let fileInput = $state<HTMLInputElement | null>(null);
	let dragActive = $state(false);
	let localProjectId = $state<string | null>(null);
	let projectReady: Promise<string> | null = null;
	let batchCompleteNotified = false;

	const fileInputId = 'import-gateway-file-input';
	const fileObjects = new SvelteMap<string, File>();
	const abortControllers = new SvelteMap<string, AbortController>();

	const activeProjectId = $derived(projectId ?? localProjectId);
	const uploadCountLabel = $derived(`${files.length} file${files.length === 1 ? '' : 's'}`);

	function maybeNotifyBatchComplete() {
		if (batchCompleteNotified || !files.length) return;

		const allSettled = files.every((file) => file.done || file.error);
		const hasSuccess = files.some((file) => file.done);
		if (!allSettled || !hasSuccess) return;

		batchCompleteNotified = true;
		onbatchcomplete?.();
	}

	function statusLabelFor(file: ImportUploadFile): string {
		if (file.error) return 'Failed';
		if (file.done) return formatBytes(file.size);
		if (file.progress > 0) return `${file.progress}%`;
		return 'Queued';
	}

	function syncStatusLabels() {
		files = files.map((file) => ({ ...file, statusLabel: statusLabelFor(file) }));
	}

	function updateFileProgress(id: string, progress: number) {
		files = files.map((entry) =>
			entry.id === id
				? {
						...entry,
						progress,
						statusLabel: progress >= 100 ? formatBytes(entry.size) : `${progress}%`
					}
				: entry
		);
	}

	function markFileDone(id: string) {
		files = files.map((entry) =>
			entry.id === id
				? { ...entry, progress: 100, done: true, statusLabel: formatBytes(entry.size) }
				: entry
		);
		maybeNotifyBatchComplete();
	}

	function markFileFailed(id: string) {
		files = files.map((entry) =>
			entry.id === id ? { ...entry, error: true, statusLabel: 'Failed' } : entry
		);
		maybeNotifyBatchComplete();
	}

	function stopUpload(id: string) {
		abortControllers.get(id)?.abort();
		abortControllers.delete(id);
	}

	function stopAllUploads() {
		for (const controller of abortControllers.values()) {
			controller.abort();
		}
		abortControllers.clear();
	}

	async function startUpload(fileEntry: ImportUploadFile, file: File) {
		const controller = new AbortController();
		abortControllers.set(fileEntry.id, controller);

		try {
			let pid = activeProjectId;

			if (!pid) {
				if (!projectReady) {
					const creation = (async () => {
						const result = await uploadImportMedia({
							projectId: null,
							projectTitle,
							file,
							onProgress: (ratio) => updateFileProgress(fileEntry.id, Math.round(ratio * 100)),
							onProjectCreated: (id) => {
								localProjectId = id;
								onprojectcreated?.(id);
							}
						});
						return result.projectId;
					})();
					projectReady = creation;

					try {
						await creation;
					} catch (error) {
						// Reset so a later file can retry project creation instead of
						// inheriting this rejected promise and failing immediately.
						projectReady = null;
						throw error;
					}
					if (controller.signal.aborted) return;
					markFileDone(fileEntry.id);
					return;
				}

				pid = await projectReady;
			}

			if (controller.signal.aborted) return;

			await uploadImportMedia({
				projectId: pid,
				projectTitle,
				file,
				onProgress: (ratio) => updateFileProgress(fileEntry.id, Math.round(ratio * 100))
			});

			if (controller.signal.aborted) return;
			markFileDone(fileEntry.id);
		} catch {
			if (!controller.signal.aborted) {
				markFileFailed(fileEntry.id);
			}
		} finally {
			abortControllers.delete(fileEntry.id);
			fileObjects.delete(fileEntry.id);
		}
	}

	function addFiles(selected: FileList | File[]) {
		const next = Array.from(selected);
		if (!next.length) return;

		const entries: ImportUploadFile[] = next.map((file) => ({
			id: crypto.randomUUID(),
			name: file.name,
			size: file.size,
			progress: 0,
			done: false,
			statusLabel: 'Queued'
		}));

		for (let index = 0; index < entries.length; index += 1) {
			fileObjects.set(entries[index]!.id, next[index]!);
		}

		files = [...files, ...entries];
		mode = 'uploading';

		for (const entry of entries) {
			const file = fileObjects.get(entry.id);
			if (file) void startUpload(entry, file);
		}
	}

	function openFilePicker(event: MouseEvent) {
		event.stopPropagation();
		fileInput?.click();
	}

	function handleFileInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		addFiles(input.files ?? []);
		input.value = '';
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		const dropped = event.dataTransfer?.files;
		if (dropped?.length) addFiles(dropped);
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function removeFile(id: string) {
		stopUpload(id);
		fileObjects.delete(id);
		files = files.filter((file) => file.id !== id);
		if (!files.length) {
			mode = 'idle';
			batchCompleteNotified = false;
			return;
		}
		syncStatusLabels();
	}

	function cancelAll() {
		stopAllUploads();
		fileObjects.clear();
		files = [];
		mode = 'idle';
		batchCompleteNotified = false;
	}

	function handleRecord(event: MouseEvent) {
		event.stopPropagation();
		onrecord?.();
	}

	onDestroy(() => {
		stopAllUploads();
	});
</script>

<div class="import-gateway" data-testid="import-gateway" data-mode={mode}>
	{#if mode === 'idle'}
		<div
			class={['import-gateway__idle', dragActive ? 'import-gateway__idle--drag-active' : '']}
			data-testid="import-gateway-idle"
		>
			<label
				class="import-gateway__drop-zone"
				for={fileInputId}
				aria-labelledby="import-gateway-heading"
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
			>
				<div class="import-gateway__icon" aria-hidden="true">
					<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M12 16V4M12 4l-5 5M12 4l5 5"
							fill="none"
							stroke="var(--on-accent)"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"
							fill="none"
							stroke="var(--on-accent)"
							stroke-width="2.2"
							stroke-linecap="round"
						/>
					</svg>
				</div>

				<h2 id="import-gateway-heading" class="import-gateway__heading">Start your video</h2>
				<p class="import-gateway__description">
					Drop a clip here, or pick a source below. Transcribe when you are ready to edit by words —
					cut, trim, and caption from the transcript.
				</p>
			</label>

			<div class="import-gateway__actions">
				<button type="button" class="import-gateway__tile" onclick={handleRecord}>
					<span
						class="import-gateway__tile-icon import-gateway__tile-icon--record"
						aria-hidden="true"
					></span>
					<span class="import-gateway__tile-title">Record</span>
					<span class="import-gateway__tile-meta">Camera or screen</span>
				</button>
				<button type="button" class="import-gateway__tile" onclick={openFilePicker}>
					<span
						class="import-gateway__tile-icon import-gateway__tile-icon--upload"
						aria-hidden="true"
					>
						<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M12 16V5M12 5l-4 4M12 5l4 4"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<path
								d="M5 17v2h14v-2"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</span>
					<span class="import-gateway__tile-title">Upload a file</span>
					<span class="import-gateway__tile-meta">MP4, MOV, WAV</span>
				</button>
			</div>

			<p class="import-gateway__footnote">Up to 2 GB · English, Spanish, French &amp; 20 more</p>
		</div>
	{:else}
		<div class="import-gateway__uploading" data-testid="import-gateway-uploading">
			<div class="import-gateway__uploading-header">
				<h2 class="import-gateway__uploading-title">Uploading footage</h2>
				<p class="import-gateway__uploading-count">{uploadCountLabel}</p>
				<button type="button" class="import-gateway__cancel-all" onclick={cancelAll}>
					Cancel all
				</button>
			</div>

			<ul class="import-gateway__file-list">
				{#each files as file (file.id)}
					<li class="import-gateway__file-row">
						<span class="import-gateway__file-icon" aria-hidden="true">
							<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8l-4-5z"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linejoin="round"
								/>
								<path
									d="M14 3v5h4"
									fill="none"
									stroke="currentColor"
									stroke-width="1.6"
									stroke-linejoin="round"
								/>
							</svg>
						</span>

						<div class="import-gateway__file-body">
							<div class="import-gateway__file-meta">
								<span class="import-gateway__file-name">{file.name}</span>
								<span class="import-gateway__file-status">{file.statusLabel}</span>
							</div>
							<ProgressBar
								value={file.progress}
								label={`Upload progress for ${file.name}`}
								class="import-gateway__file-progress"
							/>
						</div>

						{#if file.done}
							<span class="import-gateway__file-done" aria-label="Upload complete">
								<svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true">
									<polyline
										points="5,12 10,17 19,7"
										fill="none"
										stroke="var(--accent)"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</span>
						{/if}

						<button
							type="button"
							class="import-gateway__file-remove"
							aria-label={`Remove ${file.name}`}
							onclick={() => removeFile(file.id)}
						>
							✕
						</button>
					</li>
				{/each}
			</ul>

			<p class="import-gateway__uploading-hint">
				Transcription starts automatically once each file finishes uploading.
			</p>
		</div>
	{/if}

	<input
		bind:this={fileInput}
		id={fileInputId}
		class="import-gateway__file-input"
		type="file"
		multiple
		accept="video/mp4,video/quicktime,video/webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,.mp4,.mov,.webm,.mp3,.wav,.m4a,.aac,.ogg"
		aria-hidden="true"
		tabindex={-1}
		onchange={handleFileInput}
	/>
</div>

<style>
	.import-gateway {
		width: 100%;
		max-width: 680px;
	}

	.import-gateway__idle {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		padding: 48px 40px;
		border: 1.5px dashed var(--border-7);
		border-radius: 20px;
		background: color-mix(in srgb, var(--surface-2) 50%, transparent);
		text-align: center;
	}

	.import-gateway__idle--drag-active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--surface-3) 60%, transparent);
	}

	.import-gateway__drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		cursor: pointer;
		font: inherit;
		color: inherit;
	}

	.import-gateway__drop-zone:hover,
	.import-gateway__idle--drag-active .import-gateway__drop-zone {
		color: inherit;
	}

	.import-gateway__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 62px;
		height: 62px;
		margin-bottom: 22px;
		border-radius: 16px;
		background: var(--accent);
	}

	.import-gateway__heading {
		margin: 0 0 10px;
		font-size: 23px;
		font-weight: 600;
		letter-spacing: -0.02em;
		color: var(--text-1);
	}

	.import-gateway__description {
		margin: 0 0 30px;
		max-width: 420px;
		font-size: 14px;
		line-height: 1.6;
		color: var(--text-5);
	}

	.import-gateway__actions {
		display: flex;
		gap: 14px;
		width: 100%;
		max-width: 520px;
	}

	.import-gateway__tile {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 11px;
		padding: 20px 14px;
		border: 1px solid var(--border-5);
		border-radius: 13px;
		background: var(--surface-2);
		cursor: pointer;
		font: inherit;
		color: inherit;
	}

	.import-gateway__tile:hover {
		border-color: var(--border-8);
		background: var(--surface-3);
	}

	.import-gateway__tile-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
	}

	.import-gateway__tile-icon--record {
		background: color-mix(in srgb, var(--accent) 13%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 42%, transparent);
	}

	.import-gateway__tile-icon--record::after {
		content: '';
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--accent);
	}

	.import-gateway__tile-icon--upload {
		background: var(--surface-3);
		border: 1px solid var(--border-7);
		color: var(--text-3);
	}

	.import-gateway__tile-title {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--text-2);
	}

	.import-gateway__tile-meta {
		font-size: 11px;
		color: var(--text-7);
	}

	.import-gateway__footnote {
		margin: 26px 0 0;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-placeholder);
	}

	.import-gateway__uploading {
		width: 100%;
		max-width: 520px;
	}

	.import-gateway__uploading-header {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 18px;
	}

	.import-gateway__uploading-title {
		margin: 0;
		font-size: 17px;
		font-weight: 600;
		color: var(--text-1);
	}

	.import-gateway__uploading-count {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-7);
	}

	.import-gateway__cancel-all {
		margin-left: auto;
		padding: 6px 12px;
		border: 1px solid var(--border-6);
		border-radius: 8px;
		background: transparent;
		color: var(--text-5);
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.import-gateway__cancel-all:hover {
		color: var(--text-1);
		border-color: var(--border-8);
	}

	.import-gateway__file-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.import-gateway__file-row {
		display: flex;
		align-items: center;
		gap: 13px;
		padding: 13px 15px;
		border: 1px solid var(--border-4);
		border-radius: 12px;
		background: var(--surface-2);
	}

	.import-gateway__file-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 38px;
		width: 38px;
		height: 38px;
		border: 1px solid var(--border-6);
		border-radius: 9px;
		background: var(--surface-3);
		color: var(--text-3);
	}

	.import-gateway__file-body {
		flex: 1;
		min-width: 0;
	}

	.import-gateway__file-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 7px;
	}

	.import-gateway__file-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.import-gateway__file-status {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-7);
		white-space: nowrap;
	}

	.import-gateway__file-done {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 16%, transparent);
	}

	.import-gateway__file-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		width: 22px;
		height: 22px;
		border: 1px solid var(--border-6);
		border-radius: 6px;
		background: transparent;
		color: var(--text-6);
		font-size: 11px;
		cursor: pointer;
	}

	.import-gateway__file-remove:hover {
		color: var(--text-1);
		border-color: var(--border-8);
	}

	.import-gateway__uploading-hint {
		margin: 16px 0 0;
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--text-7);
	}

	.import-gateway__file-input {
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

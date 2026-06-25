<script lang="ts">
	import Toggle from '$lib/components/ui/Toggle.svelte';

	interface Props {
		resourceCount?: number;
		snapEnabled?: boolean;
		snapDisabled?: boolean;
		zoomThumbPercent?: number;
		onrecord?: () => void;
		onmedia?: () => void;
		onsnapchange?: (enabled: boolean) => void;
		class?: string;
	}

	let {
		resourceCount = 0,
		snapEnabled = true,
		snapDisabled = false,
		zoomThumbPercent = 38,
		onrecord,
		onmedia,
		onsnapchange,
		class: className = ''
	}: Props = $props();
</script>

<header class={['timeline-toolbar', className]}>
	<h2 class="timeline-toolbar__title">Timeline</h2>

	<div class="timeline-toolbar__zoom" aria-label="Zoom controls (visual only)">
		<button
			type="button"
			class="timeline-toolbar__zoom-btn"
			aria-hidden="true"
			tabindex="-1"
			disabled
		>
			−
		</button>
		<div class="timeline-toolbar__zoom-track" aria-hidden="true">
			<div class="timeline-toolbar__zoom-thumb" style:left="{zoomThumbPercent}%"></div>
		</div>
		<button
			type="button"
			class="timeline-toolbar__zoom-btn"
			aria-hidden="true"
			tabindex="-1"
			disabled
		>
			+
		</button>
	</div>

	<div class="timeline-toolbar__actions">
		<button type="button" class="timeline-toolbar__record" onclick={onrecord}>
			<span class="timeline-toolbar__record-dot" aria-hidden="true"></span>
			Record
		</button>

		<button type="button" class="timeline-toolbar__media" onclick={onmedia}>
			<span class="timeline-toolbar__media-icon" aria-hidden="true"></span>
			Media · {resourceCount}
		</button>

		<div class="timeline-toolbar__divider" aria-hidden="true"></div>

		<div class="timeline-toolbar__snap">
			<span class="timeline-toolbar__snap-label">Snap</span>
			<Toggle
				label="Snap"
				size="sm"
				checked={snapEnabled}
				disabled={snapDisabled}
				onchange={onsnapchange}
			/>
		</div>
	</div>
</header>

<style>
	.timeline-toolbar {
		display: flex;
		align-items: center;
		gap: 14px;
		height: 42px;
		flex: 0 0 42px;
		padding: 0 18px;
		border-bottom: 1px solid var(--border-1);
	}

	.timeline-toolbar__title {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-4);
	}

	.timeline-toolbar__zoom {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.timeline-toolbar__zoom-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		padding: 0;
		border: 1px solid var(--border-6);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-5);
		font-size: 14px;
		line-height: 1;
		cursor: default;
		opacity: 0.85;
	}

	.timeline-toolbar__zoom-track {
		position: relative;
		width: 84px;
		height: 4px;
		border-radius: 3px;
		background: var(--border-4);
	}

	.timeline-toolbar__zoom-thumb {
		position: absolute;
		top: 50%;
		width: 11px;
		height: 11px;
		border-radius: var(--radius-pill);
		background: var(--text-3);
		transform: translate(-50%, -50%);
	}

	.timeline-toolbar__actions {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-left: auto;
	}

	.timeline-toolbar__record,
	.timeline-toolbar__media {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 13px;
		border-radius: var(--radius-md);
		font-family: inherit;
		font-size: 12px;
		font-weight: 500;
		line-height: 1;
		cursor: pointer;
	}

	.timeline-toolbar__record {
		border: 1px solid var(--danger-tint-42);
		background: var(--danger-tint-12);
		color: var(--danger-text);
	}

	.timeline-toolbar__media {
		border: 1px solid var(--border-6);
		background: var(--surface-6);
		color: var(--text-3);
		font-weight: 400;
	}

	.timeline-toolbar__record-dot {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--danger);
	}

	.timeline-toolbar__media-icon {
		position: relative;
		width: 11px;
		height: 11px;
	}

	.timeline-toolbar__media-icon::before,
	.timeline-toolbar__media-icon::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		background: currentColor;
		border-radius: 2px;
	}

	.timeline-toolbar__media-icon::before {
		width: 11px;
		height: 1.6px;
	}

	.timeline-toolbar__media-icon::after {
		width: 1.6px;
		height: 11px;
	}

	.timeline-toolbar__divider {
		width: 1px;
		height: 20px;
		background: var(--border-6);
	}

	.timeline-toolbar__snap {
		display: flex;
		align-items: center;
		gap: 9px;
	}

	.timeline-toolbar__snap-label {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-7);
	}
</style>

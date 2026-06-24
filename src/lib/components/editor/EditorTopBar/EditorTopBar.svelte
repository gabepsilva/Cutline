<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import TransportControls from './TransportControls.svelte';

	interface Props {
		title: string;
		meta: string;
		backLabel?: string;
		playing?: boolean;
		current?: number;
		total?: number;
		onback?: () => void;
		ontoStart?: () => void;
		ontogglePlay?: () => void;
		ontoEnd?: () => void;
		ontoggleCaptions?: () => void;
		onshare?: () => void;
		onexport?: () => void;
		class?: string;
	}

	let {
		title,
		meta,
		backLabel = 'Projects',
		playing = false,
		current = 0,
		total = 0,
		onback,
		ontoStart,
		ontogglePlay,
		ontoEnd,
		ontoggleCaptions,
		onshare,
		onexport,
		class: className = ''
	}: Props = $props();
</script>

<header class={['editor-top-bar', className]}>
	<button type="button" class="editor-top-bar__back" onclick={onback}>
		<span class="editor-top-bar__back-chevron" aria-hidden="true"></span>
		{backLabel}
	</button>

	<div class="editor-top-bar__divider" aria-hidden="true"></div>

	<div class="editor-top-bar__project">
		<div class="editor-top-bar__title">{title}</div>
		<div class="editor-top-bar__meta">{meta}</div>
	</div>

	<TransportControls {playing} {current} {total} {ontoStart} {ontogglePlay} {ontoEnd} />

	<button type="button" class="editor-top-bar__captions" onclick={ontoggleCaptions}>
		<span class="editor-top-bar__captions-icon" aria-hidden="true"></span>
		Captions
	</button>

	<Button variant="secondary" size="md" onclick={onshare} class="editor-top-bar__share">
		Share
	</Button>

	<Button variant="primary" size="md" onclick={onexport}>Export</Button>
</header>

<style>
	.editor-top-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		height: var(--topbar-h);
		flex: 0 0 var(--topbar-h);
		padding: 0 16px;
		background: var(--surface-3);
		border-bottom: 1px solid var(--border-3);
	}

	.editor-top-bar__back {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 9px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-5);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}

	.editor-top-bar__back-chevron {
		width: 0;
		height: 0;
		border-top: 5px solid transparent;
		border-bottom: 5px solid transparent;
		border-right: 7px solid currentColor;
	}

	.editor-top-bar__divider {
		width: 1px;
		height: 22px;
		background: var(--border-6);
		flex-shrink: 0;
	}

	.editor-top-bar__project {
		display: flex;
		flex-direction: column;
		line-height: 1.2;
		min-width: 0;
		flex-shrink: 1;
	}

	.editor-top-bar__title {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--text-1);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.editor-top-bar__meta {
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: var(--text-8);
	}

	.editor-top-bar__captions {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 11px;
		border: 1px solid var(--border-5);
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--text-5);
		font: inherit;
		font-size: 12.5px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.editor-top-bar__captions-icon {
		width: 15px;
		height: 11px;
		border-radius: 2px;
		border: 1.4px solid currentColor;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 1px;
	}

	.editor-top-bar__captions-icon::after {
		content: '';
		width: 6px;
		height: 1.4px;
		background: currentColor;
	}

	:global(.editor-top-bar__share.button) {
		flex-shrink: 0;
	}
</style>

<script lang="ts">
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import type { EditorRailItem } from './EditorIconRail.types';
	import { defaultEditorRailItems } from './EditorIconRail.fixtures';

	interface Props {
		items?: EditorRailItem[];
		class?: string;
		onitemclick?: (item: EditorRailItem, event: MouseEvent) => void;
	}

	let { items = defaultEditorRailItems, class: className = '', onitemclick }: Props = $props();

	const mainItems = $derived(items.filter((item) => item.icon !== 'settings'));
	const settingsItem = $derived(items.find((item) => item.icon === 'settings'));
</script>

<nav class={['editor-icon-rail', className]} aria-label="Editor tools">
	{#each mainItems as item (item.id)}
		<IconButton
			label={item.label}
			variant="ghost"
			size="md"
			class={[
				'editor-icon-rail__button',
				item.active ? 'editor-icon-rail__button--active' : ''
			].join(' ')}
			onclick={(event) => onitemclick?.(item, event)}
		>
			{#if item.icon === 'preview'}
				<span class="editor-icon-rail__glyph editor-icon-rail__glyph--preview" aria-hidden="true"
				></span>
			{:else if item.icon === 'record'}
				<span class="editor-icon-rail__glyph editor-icon-rail__glyph--record" aria-hidden="true"
				></span>
			{:else if item.icon === 'audio'}
				<span class="editor-icon-rail__glyph editor-icon-rail__glyph--audio" aria-hidden="true">
					<span></span><span></span><span></span>
				</span>
			{:else if item.icon === 'media'}
				<span class="editor-icon-rail__glyph editor-icon-rail__glyph--media" aria-hidden="true"
				></span>
			{/if}
		</IconButton>
	{/each}

	{#if settingsItem}
		<IconButton
			label={settingsItem.label}
			variant="ghost"
			size="md"
			class="editor-icon-rail__button editor-icon-rail__button--settings"
			onclick={(event) => onitemclick?.(settingsItem, event)}
		>
			<span class="editor-icon-rail__glyph editor-icon-rail__glyph--settings" aria-hidden="true"
			></span>
		</IconButton>
	{/if}
</nav>

<style>
	.editor-icon-rail {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: var(--rail-w);
		flex: 0 0 var(--rail-w);
		padding: 14px 0;
		gap: 6px;
		background: var(--surface-1);
		border-right: 1px solid var(--border-2);
	}

	:global(.editor-icon-rail__button.icon-button) {
		width: 36px;
		height: 36px;
		border-radius: 9px;
		color: var(--text-8);
	}

	:global(.editor-icon-rail__button--active.icon-button) {
		background: var(--surface-active);
		border: 1px solid var(--border-7);
	}

	:global(.editor-icon-rail__button--settings.icon-button) {
		margin-top: auto;
	}

	.editor-icon-rail__glyph--preview {
		width: 13px;
		height: 9px;
		border-radius: 1px;
		border: 1.5px solid var(--accent);
	}

	.editor-icon-rail__glyph--record {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 1.5px solid currentColor;
	}

	.editor-icon-rail__glyph--audio {
		display: flex;
		gap: 2px;
		align-items: flex-end;
	}

	.editor-icon-rail__glyph--audio span:nth-child(1) {
		width: 2px;
		height: 7px;
		background: currentColor;
	}

	.editor-icon-rail__glyph--audio span:nth-child(2) {
		width: 2px;
		height: 12px;
		background: currentColor;
	}

	.editor-icon-rail__glyph--audio span:nth-child(3) {
		width: 2px;
		height: 9px;
		background: currentColor;
	}

	.editor-icon-rail__glyph--media {
		width: 13px;
		height: 13px;
		border-radius: 3px;
		border: 1.5px solid currentColor;
	}

	.editor-icon-rail__glyph--settings {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1.5px solid currentColor;
	}
</style>

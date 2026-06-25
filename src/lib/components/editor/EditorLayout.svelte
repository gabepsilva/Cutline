<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { EditorState } from '$lib/editor/editor-state.svelte';
	import EditorIconRail from './EditorIconRail.svelte';
	import type { EditorRailItem } from './EditorIconRail.types';
	import { defaultEditorRailItems } from './EditorIconRail.fixtures';
	import EditorTopBar from './EditorTopBar/EditorTopBar.svelte';

	interface Props {
		title: string;
		meta: string;
		editor?: EditorState;
		playing?: boolean;
		current?: number;
		total?: number;
		railItems?: EditorRailItem[];
		class?: string;
		onback?: () => void;
		ontoStart?: () => void;
		ontogglePlay?: () => void;
		ontoEnd?: () => void;
		ontoggleCaptions?: () => void;
		onshare?: () => void;
		onexport?: () => void;
		onrailclick?: (item: EditorRailItem, event: MouseEvent) => void;
		children: Snippet;
	}

	let {
		title,
		meta,
		editor,
		playing = false,
		current = 0,
		total = 0,
		railItems = defaultEditorRailItems,
		class: className = '',
		onback,
		ontoStart,
		ontogglePlay,
		ontoEnd,
		ontoggleCaptions,
		onshare,
		onexport,
		onrailclick,
		children
	}: Props = $props();
</script>

<div class={['editor-layout', className]}>
	<EditorTopBar
		{title}
		{meta}
		{editor}
		{playing}
		{current}
		{total}
		{onback}
		{ontoStart}
		{ontogglePlay}
		{ontoEnd}
		{ontoggleCaptions}
		{onshare}
		{onexport}
	/>
	<div class="editor-layout__workspace">
		<EditorIconRail items={railItems} onitemclick={onrailclick} />
		<div class="editor-layout__content">
			{@render children()}
		</div>
	</div>
</div>

<style>
	.editor-layout {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 100vh;
	}

	.editor-layout__workspace {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.editor-layout__content {
		flex: 1;
		min-width: 0;
		min-height: 0;
		display: flex;
	}
</style>

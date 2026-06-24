<script lang="ts">
	import Modal from './Modal.svelte';
	import type { ModalLayer } from './Modal.types';

	interface Props {
		open?: boolean;
		title?: string;
		layer?: ModalLayer;
		onclose?: () => void;
	}

	let { open = true, title = 'Export video', layer = 'export', onclose }: Props = $props();
</script>

<Modal {open} {title} {layer} {onclose}>
	<p>Modal body content</p>
</Modal>

<script lang="ts">
	import ImportGateway from './ImportGateway.svelte';

	interface Props {
		onrecord?: () => void;
		onprojectcreated?: (projectId: string) => void;
		onbatchcomplete?: () => void;
	}

	let { onrecord, onprojectcreated, onbatchcomplete }: Props = $props();
</script>

<div class="import-gateway-harness">
	<ImportGateway projectTitle="Untitled project" {onrecord} {onprojectcreated} {onbatchcomplete} />
</div>

<style>
	.import-gateway-harness {
		padding: 24px;
		background: var(--surface-1);
		min-height: 480px;
	}
</style>

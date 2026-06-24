<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DashboardLayout from '$lib/components/layout/DashboardLayout.svelte';
	import DashboardHeader from '$lib/components/dashboard/DashboardHeader.svelte';
	import EditorLayout from '$lib/components/editor/EditorLayout.svelte';
	import Timeline from '$lib/components/editor/timeline/Timeline.svelte';
	import {
		mockTimelineBars,
		mockTimelineClips,
		mockTimelinePlayheadPercent,
		mockTimelineResourceCount,
		mockTimelineTicks
	} from '$lib/mocks/timeline.mock';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const greeting = $derived(`Welcome back, ${data.user.name.split(' ')[0]}`);
</script>

<svelte:head>
	<title>Shell preview — Cutline</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="description" content="Internal layout shell preview (dev/staging only)" />
</svelte:head>

<div class="shells-preview" data-testid="shells-preview">
	<section
		class="shells-preview__section"
		data-testid="shells-dashboard"
		aria-label="Dashboard shell"
	>
		<DashboardLayout user={data.user} usage={data.usage}>
			<DashboardHeader title="Home" {greeting}>
				{#snippet actions()}
					<Button variant="primary" size="lg" class="shells-preview__cta">
						<span class="shells-preview__cta-icon" aria-hidden="true"></span>
						New project
					</Button>
				{/snippet}
			</DashboardHeader>
			<p class="shells-preview__note">
				Dashboard shell preview — full widgets are on <code>/</code>.
			</p>
		</DashboardLayout>
	</section>

	<section class="shells-preview__section" data-testid="shells-editor" aria-label="Editor shell">
		<EditorLayout title={data.editorTitle} meta={data.editorMeta}>
			<div class="shells-preview__editor" data-testid="editor-shell-body">
				<p class="shells-preview__note shells-preview__editor-note">
					Editor workspace shell — transcript and preview panels land in M5.
				</p>
				<Timeline
					ticks={mockTimelineTicks}
					bars={mockTimelineBars}
					clips={mockTimelineClips}
					playheadPercent={mockTimelinePlayheadPercent}
					resourceCount={mockTimelineResourceCount}
				/>
			</div>
		</EditorLayout>
	</section>
</div>

<style>
	.shells-preview__section + .shells-preview__section {
		border-top: 1px solid var(--border-5);
	}

	.shells-preview__note {
		margin: 0;
		font-size: 13px;
		color: var(--text-6);
		line-height: 1.5;
	}

	.shells-preview__editor {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		min-width: 0;
	}

	.shells-preview__editor-note {
		margin: 16px 24px 0;
	}

	:global(.shells-preview__cta) {
		font-size: 13.5px;
		padding: 11px 18px;
		border-radius: 9px;
		gap: 9px;
	}

	.shells-preview__cta-icon {
		position: relative;
		width: 13px;
		height: 13px;
		flex-shrink: 0;
	}

	.shells-preview__cta-icon::before,
	.shells-preview__cta-icon::after {
		content: '';
		position: absolute;
		inset: 0;
		margin: auto;
		background: var(--on-accent);
		border-radius: 2px;
	}

	.shells-preview__cta-icon::before {
		width: 13px;
		height: 2px;
	}

	.shells-preview__cta-icon::after {
		width: 2px;
		height: 13px;
	}
</style>

import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import TimelineClipHarness from './TimelineClip.harness.svelte';

describe('TimelineClip.svelte', () => {
	it('renders a video clip block with positioning from the clip model', async () => {
		render(TimelineClipHarness, { variant: 'video' });

		const clip = document.querySelector<HTMLElement>('.timeline-clip--video');
		expect(clip).not.toBeNull();
		expect(clip?.style.left).toBe('2.5%');
		expect(clip?.style.width).toBe('18%');
	});

	it('renders caption variant with clip label text', async () => {
		render(TimelineClipHarness, { variant: 'caption' });

		await expect.element(page.getByText('Welcome to Cutline')).toBeInTheDocument();
		const clip = document.querySelector('.timeline-clip--caption');
		expect(clip).not.toBeNull();
	});

	it('updates label when clip prop changes', async () => {
		render(TimelineClipHarness, {
			variant: 'caption',
			clip: { leftPct: 24, widthPct: 22.5, label: 'today we are going to' }
		});

		await expect.element(page.getByText('today we are going to')).toBeInTheDocument();
	});

	it('renders a caption clip with an empty label without crashing', async () => {
		render(TimelineClipHarness, {
			variant: 'caption',
			clip: { leftPct: 0, widthPct: 0, label: '' }
		});

		const clip = document.querySelector<HTMLElement>('.timeline-clip--caption');
		expect(clip).not.toBeNull();
		expect(clip?.querySelector('.timeline-clip__label')?.textContent).toBe('');
		expect(clip?.style.left).toBe('0%');
		expect(clip?.style.width).toBe('0%');
	});
});

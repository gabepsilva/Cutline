import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import RecordReviewHarness from './RecordReview.harness.svelte';

describe('RecordReview.svelte', () => {
	it('renders captured clip metadata', async () => {
		render(RecordReviewHarness, {
			name: 'Office wide shot',
			durationLabel: '0:12'
		});

		await expect.element(page.getByText('Clip captured')).toBeInTheDocument();
		await expect.element(page.getByText('Office wide shot')).toBeInTheDocument();
		await expect.element(page.getByText('0:12 · added to media library')).toBeInTheDocument();
	});

	it('fires onkeep when Keep in library is clicked', async () => {
		const onkeep = vi.fn();
		render(RecordReviewHarness, { onkeep });

		await userEvent.click(page.getByRole('button', { name: 'Keep in library' }));

		expect(onkeep).toHaveBeenCalledOnce();
	});

	it('fires onaddtotimeline when Add to timeline is clicked', async () => {
		const onaddtotimeline = vi.fn();
		render(RecordReviewHarness, { onaddtotimeline });

		await userEvent.click(page.getByRole('button', { name: 'Add to timeline at playhead' }));

		expect(onaddtotimeline).toHaveBeenCalledOnce();
	});
});

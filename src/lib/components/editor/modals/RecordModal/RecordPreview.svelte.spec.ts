import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import RecordPreviewHarness from './RecordPreview.harness.svelte';

describe('RecordPreview.svelte', () => {
	it('renders simulated camera preview caption by default', async () => {
		render(RecordPreviewHarness, { simulated: true });

		await expect
			.element(page.getByText('simulated camera preview · grant camera access for live'))
			.toBeInTheDocument();
	});

	it('shows REC badge with elapsed time while recording', async () => {
		render(RecordPreviewHarness, { recording: true, elapsedLabel: '1:05' });

		await expect.element(page.getByText('REC 1:05')).toBeInTheDocument();
	});

	it('shows countdown overlay when counting down', async () => {
		render(RecordPreviewHarness, { countingDown: true, countdown: 2 });

		await expect.element(page.getByRole('status')).toBeInTheDocument();
		await expect.element(page.getByText('2')).toBeInTheDocument();
	});

	it('hides simulated preview when simulated is false', async () => {
		render(RecordPreviewHarness, { simulated: false });

		await expect
			.element(page.getByText('simulated camera preview · grant camera access for live'))
			.not.toBeInTheDocument();
	});
});

import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from '$lib/test/render';
import EditorTopBarHarness from './EditorTopBar.harness.svelte';

describe('EditorTopBar.svelte', () => {
	it('renders project title and meta from design', async () => {
		render(EditorTopBarHarness);

		await expect.element(page.getByText('How I edit videos 3x faster')).toBeInTheDocument();
		await expect.element(page.getByText('Auto-saved · MP4 1080p')).toBeInTheDocument();
	});

	it('renders back, captions, share, and export actions', async () => {
		render(EditorTopBarHarness);

		await expect.element(page.getByRole('button', { name: 'Projects' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Captions' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Share' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Export' })).toBeInTheDocument();
	});

	it('fires onback when Projects is clicked', async () => {
		const onback = vi.fn();
		render(EditorTopBarHarness, { onback });

		await userEvent.click(page.getByRole('button', { name: 'Projects' }));

		expect(onback).toHaveBeenCalledOnce();
	});

	it('applies top bar height token', async () => {
		render(EditorTopBarHarness);

		const title = await page.getByText('How I edit videos 3x faster').element();
		const bar = title.closest('header') as HTMLElement;
		const styles = getComputedStyle(bar);

		expect(styles.height).toBe('54px');
		expect(styles.backgroundColor).toBe('rgb(14, 14, 16)');
	});

	it('shows transcribing pill when transcription is in progress', async () => {
		render(EditorTopBarHarness, { transcribing: true, transcriptionProgress: 0.45 });

		await expect.element(page.getByText('Transcribing · 45%')).toBeInTheDocument();
	});
});

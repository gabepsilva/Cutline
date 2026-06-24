import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from '$lib/test/render';
import EditorLayoutHarness from './EditorLayout.harness.svelte';

describe('EditorLayout.svelte', () => {
	it('renders top bar, icon rail, and workspace slot', async () => {
		render(EditorLayoutHarness, { slotContent: 'Transcript panel' });

		await expect.element(page.getByText('How I edit videos 3x faster')).toBeInTheDocument();
		await expect
			.element(page.getByRole('navigation', { name: 'Editor tools' }))
			.toBeInTheDocument();
		await expect.element(page.getByText('Transcript panel')).toBeInTheDocument();
	});

	it('uses column shell with flex workspace', async () => {
		render(EditorLayoutHarness);

		const workspace = await page.getByText('Editor workspace').element();
		const content = workspace.parentElement as HTMLElement;
		const workspaceRow = content.parentElement as HTMLElement;
		const layout = workspaceRow.parentElement as HTMLElement;

		expect(getComputedStyle(layout).flexDirection).toBe('column');
		expect(getComputedStyle(workspaceRow).display).toBe('flex');
		expect(parseInt(getComputedStyle(workspaceRow).flex, 10)).toBeGreaterThan(0);
	});
});

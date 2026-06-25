import { describe, expect, it } from 'vitest';
import { fixtureMediaResource } from '$lib/test/fixtures';
import {
	clipCssPercent,
	createOverlay,
	formatPercent,
	overlayId,
	overlayPercents,
	parsePercent,
	type Clip,
	type Overlay
} from './timeline';

describe('timeline domain', () => {
	describe('formatPercent', () => {
		it.each([
			{ pct: 37.5, decimals: 3, expected: '37.500%' },
			{ pct: 0, decimals: 2, expected: '0.00%' },
			{ pct: 100, decimals: 1, expected: '100.0%' }
		])('formats $pct with $decimals decimals', ({ pct, decimals, expected }) => {
			expect(formatPercent(pct, decimals)).toBe(expected);
		});

		it('treats non-finite values as zero', () => {
			expect(formatPercent(Number.NaN)).toBe('0.000%');
		});
	});

	describe('parsePercent', () => {
		it.each([
			{ value: '23.897%', expected: 23.897 },
			{ value: '0.000%', expected: 0 },
			{ value: 'invalid', expected: 0 }
		])('parses $value', ({ value, expected }) => {
			expect(parsePercent(value)).toBe(expected);
		});
	});

	describe('clipCssPercent', () => {
		it('maps clip percentages to CSS strings', () => {
			const clip: Clip = { leftPct: 2.5, widthPct: 18, label: 'Welcome' };
			expect(clipCssPercent(clip)).toEqual({
				left: '2.500%',
				width: '18.000%'
			});
		});
	});

	describe('overlayPercents', () => {
		const overlay: Overlay = {
			id: 'o-1',
			resId: 'media-1',
			name: 'Office wide shot',
			start: 30,
			dur: 12,
			thumb: 'linear-gradient(#000,#111)'
		};

		it('positions overlay from start time', () => {
			const layout = overlayPercents(overlay, 120);
			expect(layout.leftPct).toBeCloseTo(25, 5);
			expect(layout.widthPct).toBeCloseTo(10, 5);
		});

		it('clamps left at zero and width at 1.5%', () => {
			const early: Overlay = { ...overlay, start: -5, dur: 0.1 };
			const layout = overlayPercents(early, 100);
			expect(layout.leftPct).toBe(0);
			expect(layout.widthPct).toBe(1.5);
		});

		it('uses a minimum total duration when input is zero', () => {
			const atStart: Overlay = { ...overlay, start: 0, dur: 0.001 };
			const layout = overlayPercents(atStart, 0);
			expect(layout.leftPct).toBe(0);
			expect(layout.widthPct).toBeGreaterThanOrEqual(1.5);
		});
	});

	describe('overlayId', () => {
		it('builds a stable overlay id', () => {
			expect(overlayId('media-1', 2)).toBe('o-media-1-2');
		});
	});

	describe('createOverlay', () => {
		it('creates an overlay from a media resource at the playhead', () => {
			const overlay = createOverlay(fixtureMediaResource, 12.5, 0);
			expect(overlay).toMatchObject({
				id: 'o-media-broll-1-0',
				resId: fixtureMediaResource.id,
				name: fixtureMediaResource.name,
				start: 12.5,
				dur: fixtureMediaResource.dur,
				thumb: fixtureMediaResource.thumb
			});
		});

		it('clamps negative start times to zero', () => {
			const overlay = createOverlay(fixtureMediaResource, -3, 1);
			expect(overlay.start).toBe(0);
			expect(overlay.id).toBe('o-media-broll-1-1');
		});
	});
});

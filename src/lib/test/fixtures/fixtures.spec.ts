import { describe, expect, it } from 'vitest';
import {
	fixtureMediaResource,
	fixtureProject,
	fixtureProjectCard,
	fixtureSentence,
	fixtureTranscriptWords,
	fixtureUser
} from './index';

describe('domain fixtures', () => {
	it('fixtureUser matches sidebar session shape', () => {
		expect(fixtureUser.id).toBeTruthy();
		expect(fixtureUser.initials).toHaveLength(2);
		expect(fixtureUser.name).toContain(' ');
		expect(fixtureUser.planLabel.length).toBeGreaterThan(0);
	});

	it('fixtureProject matches dashboard card shape', () => {
		expect(fixtureProject.durationLabel).toMatch(/\d+:\d{2}/);
		expect(fixtureProject.thumb).toContain('gradient');
		expect(fixtureProject.kind).toBeTruthy();
	});

	it('fixtureProjectCard is a distinct grid entry', () => {
		expect(fixtureProjectCard.id).not.toBe(fixtureProject.id);
		expect(fixtureProjectCard.title).not.toBe(fixtureProject.title);
	});

	it('fixtureMediaResource has positive duration and kind', () => {
		expect(fixtureMediaResource.dur).toBeGreaterThan(0);
		expect(fixtureMediaResource.kind).toBe('B-roll');
	});

	it('fixtureTranscriptWords link words to their sentence', () => {
		expect(fixtureTranscriptWords.length).toBeGreaterThan(1);
		expect(fixtureTranscriptWords.every((w) => w.sid === 's0')).toBe(true);
		expect(fixtureTranscriptWords.some((w) => w.filler)).toBe(true);
	});

	it('fixtureSentence aggregates its words', () => {
		expect(fixtureSentence.words).toHaveLength(fixtureTranscriptWords.length);
		expect(fixtureSentence.words[0]?.id).toBe('w0');
	});
});

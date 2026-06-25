// MOCK: Editor project + transcript until projects/transcript tables exist.
// TODO(backend): Replace with drizzle query in `projects/[id]/+page.server.ts` (M5-12).
import type { TranscriptSpeakerData } from '$lib/components/editor/transcript/TranscriptSpeaker.types';
import type { MediaResource } from '$lib/types/media';
import type { Project } from '$lib/types/project';
import type { Sentence, Word } from '$lib/types/transcript';
import { mockLatestProject, mockProjects } from './dashboard.mock';
import { mockUser } from './user.mock';

const MOCK_SCRIPT = [
	'Okay so, um, this is the part where most people completely overthink it.',
	"You don't need a thousand cuts to make a video feel fast.",
	'Honestly, you just have to cut the dead air and the, uh, filler words.',
	'Watch what happens when I delete this entire sentence right here.',
	'The whole rhythm tightens up and suddenly it just, you know, flows.',
	'That is the entire secret that nobody really wants to tell you about.',
	'Let me drop down to the timeline so you can see the waveform too.',
	'Every word you delete just disappears from the edit. No re-rendering.'
];

/** Port of design `buildTranscript()` — deterministic transcript for editor UI. */
export function buildMockTranscript(): { words: Word[]; sentences: Sentence[] } {
	const words: Word[] = [];
	const sentences: Sentence[] = [];
	let time = 0;
	let wordId = 0;
	let seed = 7;
	const rnd = () => {
		seed = (seed * 1103515245 + 12345) & 0x7fffffff;
		return (seed % 1000) / 1000;
	};

	MOCK_SCRIPT.forEach((line, sentenceIndex) => {
		const tokens = line.split(' ');
		const sentenceWords: Word[] = [];

		tokens.forEach((token) => {
			const clean = token.replace(/[^a-zA-Z']/g, '').toLowerCase();
			const duration = 0.17 + clean.length * 0.05 + (/[.,?]$/.test(token) ? 0.13 : 0);
			const barCount = Math.max(2, Math.min(5, Math.round(clean.length / 2)));
			const bars: number[] = [];
			for (let index = 0; index < barCount; index++) {
				bars.push(0.22 + rnd() * 0.78);
			}
			const filler = clean === 'um' || clean === 'uh';
			const word: Word = {
				id: `w${wordId++}`,
				text: token,
				clean,
				dur: duration,
				bars,
				filler,
				deleted: false,
				sid: `s${sentenceIndex}`
			};
			words.push(word);
			sentenceWords.push(word);
			time += duration + 0.02;
		});

		sentences.push({ id: `s${sentenceIndex}`, words: sentenceWords, t0: time });
		time += 0.2;
	});

	for (let index = 0; index < words.length - 1; index++) {
		if (words[index].clean === 'you' && words[index + 1].clean === 'know') {
			words[index].filler = true;
			words[index + 1].filler = true;
		}
	}

	return { words, sentences };
}

export const mockEditorSpeaker: TranscriptSpeakerData = {
	name: mockUser.name,
	initials: mockUser.initials
};

/** Design media shelf resources (lines 539–543). */
export const mockEditorResources: MediaResource[] = [
	{
		id: 'r1',
		name: 'City timelapse',
		dur: 6,
		kind: 'B-roll',
		thumb: 'repeating-linear-gradient(135deg,#1c2330 0 11px,#171d28 11px 22px)'
	},
	{
		id: 'r2',
		name: 'Keyboard close-up',
		dur: 4,
		kind: 'B-roll',
		thumb: 'repeating-linear-gradient(135deg,#2a2017 0 11px,#221a12 11px 22px)'
	},
	{
		id: 'r3',
		name: 'Logo sting',
		dur: 2,
		kind: 'Graphic',
		thumb: 'repeating-linear-gradient(135deg,#241a2c 0 11px,#1d1524 11px 22px)'
	}
];

export interface EditorProjectLoad {
	project: Project;
	meta: string;
	words: Word[];
	sentences: Sentence[];
	speaker: TranscriptSpeakerData;
	videoUrl: string | null;
	resources: MediaResource[];
}

/** Project id with no transcript — drives empty-state UI in the editor route. */
export const MOCK_EMPTY_TRANSCRIPT_PROJECT_ID = 'proj-no-transcript';

const mockProjectCatalog: Project[] = [
	mockLatestProject,
	...mockProjects,
	{
		id: MOCK_EMPTY_TRANSCRIPT_PROJECT_ID,
		title: 'Untitled draft',
		durationLabel: '0:00',
		kind: 'DEMO',
		meta: 'Created today',
		thumb: 'repeating-linear-gradient(135deg,#1a1d28 0 12px,#15171f 12px 24px)'
	}
];

/** Lookup editor load data by project id (mock catalog). */
export function loadMockEditorProject(id: string): EditorProjectLoad | null {
	const project = mockProjectCatalog.find((entry) => entry.id === id);
	if (!project) return null;

	if (id === MOCK_EMPTY_TRANSCRIPT_PROJECT_ID) {
		return {
			project,
			meta: 'Draft · no transcript',
			words: [],
			sentences: [],
			speaker: mockEditorSpeaker,
			videoUrl: null,
			resources: []
		};
	}

	const { words, sentences } = buildMockTranscript();

	return {
		project,
		meta: 'Auto-saved · MP4 1080p',
		words,
		sentences,
		speaker: mockEditorSpeaker,
		videoUrl: null,
		resources: mockEditorResources
	};
}

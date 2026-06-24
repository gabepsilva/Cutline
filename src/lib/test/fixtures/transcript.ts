import type { Sentence, Word } from '$lib/types/transcript';

/** Minimal word slice from design `buildTranscript()` — enough for transcript UI tests. */
const fixtureWords: Word[] = [
	{
		id: 'w0',
		text: 'Okay',
		clean: 'okay',
		dur: 0.42,
		bars: [0.45, 0.62],
		filler: false,
		deleted: false,
		sid: 's0'
	},
	{
		id: 'w1',
		text: 'so,',
		clean: 'so',
		dur: 0.35,
		bars: [0.38, 0.51],
		filler: false,
		deleted: false,
		sid: 's0'
	},
	{
		id: 'w2',
		text: 'um,',
		clean: 'um',
		dur: 0.28,
		bars: [0.31, 0.44],
		filler: true,
		deleted: false,
		sid: 's0'
	},
	{
		id: 'w3',
		text: 'this',
		clean: 'this',
		dur: 0.32,
		bars: [0.55, 0.48, 0.62],
		filler: false,
		deleted: false,
		sid: 's0'
	}
];

/** Fixture: first sentence from the design transcript script. */
export const fixtureSentence: Sentence = {
	id: 's0',
	words: fixtureWords,
	t0: 0
};

/** Fixture: word list for selection / filler tests. */
export const fixtureTranscriptWords: Word[] = fixtureWords;

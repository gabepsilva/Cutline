import { activeWords, clampTime, seekTimeFromTimelineClick } from '$lib/editor/editor-derive';
import { buildEdl, editedToSource, editedWordIdAt } from '$lib/editor/edl';
import type { ExportPhase, RecordPhase } from '$lib/types/editor';
import type { MediaResource } from '$lib/types/media';
import type { Overlay } from '$lib/types/timeline';
import type { CaptionStyle, Sentence, Word } from '$lib/types/transcript';
import { formatTimecode } from '$lib/utils/format-timecode';

export interface EditorStateInit {
	words: Word[];
	sentences: Sentence[];
	captionStyle?: CaptionStyle;
	resources?: MediaResource[];
	overlays?: Overlay[];
}

export class EditorState {
	words = $state.raw<Word[]>([]);
	sentences = $state.raw<Sentence[]>([]);
	currentTime = $state(0);
	playing = $state(false);
	selectedId = $state<string | null>(null);
	showCaptions = $state(true);
	captionStyle = $state<CaptionStyle>('karaoke');
	query = $state('');
	exportPhase = $state<ExportPhase>('none');
	exportProgress = $state(0);
	recordPhase = $state<RecordPhase>('none');
	recElapsed = $state(0);
	recCount = $state(3);
	camDenied = $state(false);
	recCounter = $state(0);
	lastResId = $state<string | null>(null);
	showMedia = $state(false);
	resources = $state.raw<MediaResource[]>([]);
	overlays = $state.raw<Overlay[]>([]);

	constructor(init: EditorStateInit) {
		this.words = init.words;
		this.sentences = init.sentences;
		if (init.captionStyle) this.captionStyle = init.captionStyle;
		if (init.resources) this.resources = init.resources;
		if (init.overlays) this.overlays = init.overlays;
	}

	// Single EDL rebuilt only when `words` changes — reused by every derivation below so the
	// rAF playback loop no longer rebuilds it on each frame (see perf issue: choppy playback).
	edl = $derived.by(() => buildEdl(this.words));
	active = $derived.by(() => activeWords(this.words));
	startMap = $derived.by(() => {
		const map: Record<string, number> = {};
		for (const segment of this.edl.segments) map[segment.wordId] = segment.editedStart;
		return map;
	});
	duration = $derived.by(() => this.edl.editedDuration);
	clampedTime = $derived.by(() => clampTime(this.currentTime, this.duration));
	currentWordId = $derived.by(() => editedWordIdAt(this.edl, this.active, this.clampedTime));
	/** Source media time under the playhead — reuses the memoized EDL (no per-frame rebuild). */
	sourceTime = $derived.by(() => editedToSource(this.edl, this.clampedTime));
	timecode = $derived.by(() => formatTimecode(this.clampedTime));
	playheadPct = $derived.by(() => (this.clampedTime / this.duration) * 100);
	fillerCount = $derived.by(() => this.active.filter((w) => w.filler).length);
	deletedCount = $derived.by(() => this.words.filter((w) => w.deleted).length);

	private setWords(words: Word[]) {
		this.words = words;
		this.sentences = this.sentences.map((sentence) => ({
			...sentence,
			words: words.filter((word) => word.sid === sentence.id)
		}));
	}

	togglePlay = () => {
		let time = this.currentTime;
		if (time >= this.duration - 0.05) time = 0;
		this.playing = !this.playing;
		this.currentTime = time;
	};

	toStart = () => {
		this.currentTime = 0;
	};

	toEnd = () => {
		this.currentTime = this.duration;
		this.playing = false;
	};

	seek = (time: number) => {
		this.currentTime = clampTime(time, this.duration);
	};

	seekFromTimelineClick = (event: MouseEvent) => {
		this.seek(seekTimeFromTimelineClick(event, this.duration));
	};

	/** Advance playback — call from `startEditorPlaybackLoop` (M5-11). */
	tick = (deltaSeconds: number) => {
		if (!this.playing) return;

		const next = this.currentTime + deltaSeconds;
		if (next >= this.duration) {
			this.currentTime = this.duration;
			this.playing = false;
			return;
		}
		this.currentTime = next;
	};

	selectWord = (word: Word) => {
		if (word.deleted) {
			this.setWords(this.words.map((w) => (w.id === word.id ? { ...w, deleted: false } : w)));
			this.selectedId = word.id;
			return;
		}

		this.selectedId = word.id;
		this.currentTime = (this.startMap[word.id] ?? 0) + 0.0005;
	};

	seekSentence = (sentence: Sentence) => {
		const firstActive = sentence.words.find((w) => !w.deleted);
		if (!firstActive) return;
		this.currentTime = (this.startMap[firstActive.id] ?? 0) + 0.0005;
	};

	deleteSelected = () => {
		const id = this.selectedId;
		if (!id) return;
		this.setWords(this.words.map((w) => (w.id === id ? { ...w, deleted: !w.deleted } : w)));
	};

	removeFillers = () => {
		this.setWords(this.words.map((w) => (w.filler && !w.deleted ? { ...w, deleted: true } : w)));
	};

	setQuery = (value: string) => {
		this.query = value;
	};

	toggleCaptions = () => {
		this.showCaptions = !this.showCaptions;
	};

	openRecord = () => {
		this.recordPhase = 'live';
		this.recElapsed = 0;
		this.camDenied = false;
		this.showMedia = false;
	};

	closeRecord = () => {
		this.recordPhase = 'none';
	};

	beginRecording = () => {
		this.recordPhase = 'countdown';
		this.recCount = 3;
	};

	advanceCountdown = () => {
		if (this.recordPhase !== 'countdown') return;
		const next = this.recCount - 1;
		if (next <= 0) {
			this.recordPhase = 'recording';
			this.recElapsed = 0;
			this.recCount = 0;
			return;
		}
		this.recCount = next;
	};

	stopRecording = () => {
		const nextCounter = this.recCounter + 1;
		const duration = Math.max(1, Math.round(this.recElapsed));
		const resource: MediaResource = {
			id: `rec-${nextCounter}`,
			name: `Recording ${nextCounter}`,
			dur: duration,
			kind: 'Recording',
			thumb: 'repeating-linear-gradient(135deg,#2a1715 0 11px,#221210 11px 22px)'
		};
		this.resources = [resource, ...this.resources];
		this.recordPhase = 'review';
		this.recCounter = nextCounter;
		this.lastResId = resource.id;
	};

	toggleMedia = () => {
		this.showMedia = !this.showMedia;
	};

	addOverlay = (resource: MediaResource) => {
		const overlay: Overlay = {
			id: `o-${resource.id}-${this.overlays.length}`,
			resId: resource.id,
			name: resource.name,
			start: this.currentTime,
			dur: resource.dur,
			thumb: resource.thumb
		};
		this.overlays = [...this.overlays, overlay];
		this.showMedia = false;
	};

	addUploadedResource = (resource: MediaResource) => {
		this.resources = [resource, ...this.resources];
	};

	addLastToTimeline = () => {
		const resource = this.resources.find((r) => r.id === this.lastResId);
		if (resource) this.addOverlay(resource);
		this.recordPhase = 'none';
	};

	removeOverlay = (id: string) => {
		this.overlays = this.overlays.filter((overlay) => overlay.id !== id);
	};

	startExport = () => {
		this.exportPhase = 'config';
	};

	closeExport = () => {
		this.exportPhase = 'none';
		this.exportProgress = 0;
	};

	runExport = () => {
		this.exportPhase = 'exporting';
		this.exportProgress = 0;
	};

	setExportProgress = (progress: number) => {
		this.exportProgress = progress;
	};

	markExportDone = () => {
		this.exportPhase = 'done';
	};
}

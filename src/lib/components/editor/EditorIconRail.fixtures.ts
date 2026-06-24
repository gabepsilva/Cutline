import type { EditorRailItem } from './EditorIconRail.types';

/** Default editor rail items from design lines 158–163. */
export const defaultEditorRailItems: EditorRailItem[] = [
	{ id: 'preview', label: 'Preview', icon: 'preview', active: true },
	{ id: 'record', label: 'Record', icon: 'record' },
	{ id: 'audio', label: 'Audio', icon: 'audio' },
	{ id: 'media', label: 'Media', icon: 'media' },
	{ id: 'settings', label: 'Settings', icon: 'settings' }
];

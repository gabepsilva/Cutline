/** Editor keyboard actions mapped from design `onKey` (lines 678–684). */
export type EditorKeyAction = 'toggle-play' | 'delete-selected';

export interface EditorKeyboardInput {
	key: string;
	targetTagName: string;
	hasSelection: boolean;
}

const TYPING_TARGETS = new Set(['INPUT', 'TEXTAREA']);

/** True when the event target is a text-entry control (design: `typing`). */
export function isTypingTarget(tagName: string): boolean {
	return TYPING_TARGETS.has(tagName.toUpperCase());
}

/**
 * Resolve a keyboard event to an editor action, or `null` when the key should be ignored.
 * DOM-free — callers pass `targetTagName` from the event target.
 */
export function resolveEditorKeyAction(input: EditorKeyboardInput): EditorKeyAction | null {
	const typing = isTypingTarget(input.targetTagName);

	if (input.key === ' ' && !typing) {
		return 'toggle-play';
	}

	if ((input.key === 'Delete' || input.key === 'Backspace') && !typing && input.hasSelection) {
		return 'delete-selected';
	}

	return null;
}

/** Whether the browser default for this key should be suppressed. */
export function shouldPreventDefault(action: EditorKeyAction): boolean {
	return action === 'toggle-play' || action === 'delete-selected';
}

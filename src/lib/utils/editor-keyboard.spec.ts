import { describe, expect, it } from 'vitest';
import {
	isTypingTarget,
	resolveEditorKeyAction,
	shouldPreventDefault,
	type EditorKeyAction
} from './editor-keyboard';

describe('isTypingTarget', () => {
	it.each([
		{ tag: 'INPUT', expected: true },
		{ tag: 'input', expected: true },
		{ tag: 'TEXTAREA', expected: true },
		{ tag: 'textarea', expected: true },
		{ tag: 'BUTTON', expected: false },
		{ tag: 'DIV', expected: false },
		{ tag: '', expected: false }
	])('returns $expected for $tag', ({ tag, expected }) => {
		expect(isTypingTarget(tag)).toBe(expected);
	});
});

describe('resolveEditorKeyAction', () => {
	it.each([
		{
			case: 'space toggles play outside inputs',
			input: { key: ' ', targetTagName: 'DIV', hasSelection: false },
			expected: 'toggle-play' as EditorKeyAction | null
		},
		{
			case: 'space ignored in input',
			input: { key: ' ', targetTagName: 'INPUT', hasSelection: false },
			expected: null
		},
		{
			case: 'space ignored in textarea',
			input: { key: ' ', targetTagName: 'TEXTAREA', hasSelection: true },
			expected: null
		},
		{
			case: 'Delete removes selection',
			input: { key: 'Delete', targetTagName: 'DIV', hasSelection: true },
			expected: 'delete-selected' as EditorKeyAction | null
		},
		{
			case: 'Backspace removes selection',
			input: { key: 'Backspace', targetTagName: 'BUTTON', hasSelection: true },
			expected: 'delete-selected' as EditorKeyAction | null
		},
		{
			case: 'Delete ignored without selection',
			input: { key: 'Delete', targetTagName: 'DIV', hasSelection: false },
			expected: null
		},
		{
			case: 'Delete ignored while typing',
			input: { key: 'Delete', targetTagName: 'INPUT', hasSelection: true },
			expected: null
		},
		{
			case: 'unrelated keys ignored',
			input: { key: 'Enter', targetTagName: 'DIV', hasSelection: true },
			expected: null
		},
		{
			case: 'arrow keys ignored',
			input: { key: 'ArrowLeft', targetTagName: 'DIV', hasSelection: true },
			expected: null
		}
	])('$case', ({ input, expected }) => {
		expect(resolveEditorKeyAction(input)).toBe(expected);
	});
});

describe('shouldPreventDefault', () => {
	it.each([
		{ action: 'toggle-play' as const, expected: true },
		{ action: 'delete-selected' as const, expected: true }
	])('returns $expected for $action', ({ action, expected }) => {
		expect(shouldPreventDefault(action)).toBe(expected);
	});
});

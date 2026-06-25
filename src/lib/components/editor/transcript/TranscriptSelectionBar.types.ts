export interface TranscriptSelectionBarProps {
	/** When false, the bar is not rendered (design `hasSelection`). */
	visible?: boolean;
	/** Display text of the selected word, shown in quotes. */
	selectedText?: string;
	/** Action label — e.g. "Delete word" or "Restore word". */
	deleteLabel?: string;
	ondelete?: (event: MouseEvent) => void;
	class?: string;
}

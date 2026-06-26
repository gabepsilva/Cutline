const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

/** Human-readable byte size for storage usage labels. */
export function formatBytes(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
	if (bytes === 0) return '0 B';

	const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
	const value = bytes / 1024 ** unitIndex;
	const unit = BYTE_UNITS[unitIndex];

	if (unit === 'GB') {
		const rounded = Math.round(value * 10) / 10;
		return `${rounded} GB`;
	}

	if (unit === 'B') return `${Math.round(value)} B`;

	return `${Math.round(value)} ${unit}`;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/** Human-readable relative time for dashboard/editor project meta. */
export function relativeTime(date: Date, now = new Date()): string {
	const elapsedMs = Math.max(0, now.getTime() - date.getTime());

	if (elapsedMs < MINUTE_MS) return 'just now';

	const minutes = Math.floor(elapsedMs / MINUTE_MS);
	if (elapsedMs < HOUR_MS) return `${minutes}m ago`;

	const hours = Math.floor(elapsedMs / HOUR_MS);
	if (elapsedMs < DAY_MS) return `${hours}h ago`;

	const days = Math.floor(elapsedMs / DAY_MS);
	if (elapsedMs < WEEK_MS) return `${days}d ago`;

	const weeks = Math.floor(elapsedMs / WEEK_MS);
	return `${weeks}w ago`;
}

/** Format seconds as `m:ss` (design `fmt()` — M1-11). */
export function formatTimecode(seconds: number): string {
	const safe = Math.max(0, seconds);
	const minutes = Math.floor(safe / 60);
	const secs = Math.floor(safe % 60);
	return `${minutes}:${String(secs).padStart(2, '0')}`;
}

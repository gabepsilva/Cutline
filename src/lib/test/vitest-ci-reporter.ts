import type { Reporter } from 'vitest/reporters';

/** Force a non-zero exit when Vitest cannot tear down browser/pool workers in time. */
export const failOnTeardownTimeout: Reporter = {
	onProcessTimeout() {
		process.exitCode = 1;
		process.exit(1);
	}
};

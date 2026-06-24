import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173,
		env: {
			DATABASE_URL: 'file:./ci-e2e.db',
			BETTER_AUTH_SECRET: 'ci-e2e-placeholder-secret-32chars'
		}
	},
	testMatch: '**/*.e2e.{ts,js}'
});

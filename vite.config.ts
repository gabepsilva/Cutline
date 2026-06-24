import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter(),

			typescript: {
				config: (config) => ({
					...config,
					include: [...config.include, '../drizzle.config.ts']
				})
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: [
				'src/lib/**/*.{ts,svelte}',
				'src/routes/**/+page.server.ts',
				'src/routes/**/+server.ts'
			],
			exclude: [
				'src/**/*.d.ts',
				'src/**/*.spec.ts',
				'src/**/*.svelte.spec.ts',
				'src/**/*.e2e.ts',
				'src/**/*.test.ts',
				// Scaffold/demo routes — coverage enforced when real routes land (M3+).
				'src/routes/demo/**',
				'src/hooks.server.ts',
				// Server layer — enable in coverage when server tests land (M3+).
				'src/lib/server/**'
			],
			thresholds: {
				lines: 80,
				'src/lib/utils/**': { lines: 95 },
				'src/lib/editor/**': { lines: 90 },
				'src/lib/components/ui/**': { lines: 85 },
				'src/lib/components/**': { lines: 80 },
				'src/routes/**/+page.server.ts': { lines: 85 },
				'src/routes/**/+server.ts': { lines: 85 }
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					coverage: {
						provider: 'istanbul'
					},
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});

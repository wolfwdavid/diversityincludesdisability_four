import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PREVIEW_PORT ?? 4271);
const ORIGIN = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: 'tests',
	testMatch: '**/*.enabled.spec.ts',
	testIgnore: '**/unit/**',
	timeout: 30_000,
	fullyParallel: true,
	workers: process.env.CI ? 2 : undefined,
	webServer: {
		command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
		url: ORIGIN,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		// Build the ENABLED variant: this dummy key overrides the committed empty .env default,
		// so $env/static/public bakes a non-empty PUBLIC_WEB3FORMS_KEY and the form prerenders.
		env: { PUBLIC_WEB3FORMS_KEY: 'test-key-web3forms-dummy', PREVIEW_PORT: String(PORT) }
	},
	use: { baseURL: ORIGIN, trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

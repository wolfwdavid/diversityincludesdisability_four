import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	fullyParallel: true,
	// Run the suite against the PRODUCTION build (adapter-static + `pnpm preview`), not the dev
	// server. Dev-mode hydration compiles modules on demand, so a click can land before the
	// button's handler is attached (lost interaction). The preview build hydrates near-instantly,
	// so interaction tests are reliable — and it exercises the same artifact shipped to Pages.
	// `base` is '' here (BASE_PATH only set for the gh-pages build), so test URLs stay plain `/`.
	webServer: {
		command: 'pnpm build && pnpm preview --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

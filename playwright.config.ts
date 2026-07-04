import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	fullyParallel: true,
	webServer: {
		command: 'pnpm dev --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});

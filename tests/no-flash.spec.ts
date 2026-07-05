import { test, expect } from '@playwright/test';

test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/', { waitUntil: 'commit' });
	// data-mode is written ONLY by the synchronous inline <head> script (pre-paint); the store
	// merely reads it. Polling therefore still proves pre-paint origin — no later code path can
	// satisfy it. `?.` tolerates the transient-null documentElement race that flaked the old
	// one-shot page.evaluate() under parallel-worker contention.
	const readMode = () => page.evaluate(() => document.documentElement?.dataset.mode ?? null);
	await expect.poll(readMode, { timeout: 5_000 }).toBe('premium');
});

test('no Google Fonts request fires (self-hosted)', async ({ page }) => {
	const hits: string[] = [];
	page.on('request', (r) => {
		const u = r.url();
		if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) hits.push(u);
	});
	await page.goto('/', { waitUntil: 'networkidle' });
	expect(hits).toEqual([]);
});

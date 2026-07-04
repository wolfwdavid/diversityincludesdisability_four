import { test, expect } from '@playwright/test';

test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/', { waitUntil: 'commit' });
	expect(await page.evaluate(() => document.documentElement.dataset.mode)).toBe('premium');
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

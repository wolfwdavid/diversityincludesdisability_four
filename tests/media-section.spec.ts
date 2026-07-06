import { test, expect } from '@playwright/test';

// site.podcasts is empty → the About page must have NO media section at all (no heading, no
// landmark, no empty shell).
test('empty podcasts list → no media section on /about', async ({ page }) => {
	await page.goto('/about/');
	await expect(page.locator('#media-h')).toHaveCount(0);
	await expect(page.locator('section.media')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: /media/i })).toHaveCount(0);
});

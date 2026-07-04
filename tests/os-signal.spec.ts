import { test, expect } from '@playwright/test';

test('reduced-motion auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('prefers-contrast: more auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ contrast: 'more' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('no OS signal defaults to Premium', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});

test('explicit stored choice overrides OS signal (MODE-04 agency)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});

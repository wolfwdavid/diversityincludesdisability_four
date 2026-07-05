import { test, expect } from '@playwright/test';

// A11Y-04 (WCAG 2.5.8 Target Size >= 44x44 CSS px). At mobile width the primary interactive
// targets — the mode toggle, the mobile menu button, and each social link — must each present
// a hit area of at least 44x44. Extends the boundingBox precedent from mode-toggle.spec.ts.

test.use({ viewport: { width: 375, height: 800 } });

async function expectAtLeast44(locator: import('@playwright/test').Locator) {
	const box = await locator.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeGreaterThanOrEqual(44);
	expect(box!.height).toBeGreaterThanOrEqual(44);
}

test('mode toggle is at least 44x44 at 375px', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expectAtLeast44(page.getByRole('button', { name: /visual mode/i }));
});

test('mobile menu button is at least 44x44 at 375px', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expectAtLeast44(page.getByRole('button', { name: /menu/i }));
});

test('every social link is at least 44x44 at 375px', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	const socials = page.locator('a[rel~="me"]');
	const count = await socials.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) await expectAtLeast44(socials.nth(i));
});

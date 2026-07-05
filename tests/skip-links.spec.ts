import { test, expect } from '@playwright/test';

// A11Y-01 (WCAG 2.4.1 Bypass Blocks): a keyboard user's very first Tab must land on a
// "Skip to main content" link that jumps focus into <main>. A second "Skip to navigation"
// link lets them jump straight to the nav landmark.

test('first Tab focuses "Skip to main content" and it targets #main', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab'); // first focusable element in the DOM
	const first = page.locator(':focus');
	await expect(first).toHaveText(/skip to main content/i);
	await expect(first).toHaveAttribute('href', '#main');
});

test('activating the skip link moves focus to #main', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');
	const first = page.locator(':focus');
	await expect(first).toHaveText(/skip to main content/i);
	await first.click();
	// Requires tabindex="-1" on <main id="main"> so it is programmatically focusable.
	await expect(page.locator('#main')).toBeFocused();
});

test('a "Skip to navigation" link exists targeting #nav', async ({ page }) => {
	await page.goto('/');
	const skipToNav = page.getByRole('link', { name: /skip to navigation/i });
	await expect(skipToNav).toHaveAttribute('href', '#nav');
});

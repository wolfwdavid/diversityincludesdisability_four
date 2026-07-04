import { test, expect } from '@playwright/test';

test('toggle flips data-mode + aria-pressed and persists across reload', async ({ page }) => {
	// Seed the starting choice ONCE. addInitScript re-runs on every navigation (including the
	// reload below), so guard it — otherwise the reload would clobber the value whose
	// persistence this test is asserting.
	await page.addInitScript(() => {
		if (!localStorage.getItem('did-mode')) localStorage.setItem('did-mode', 'accessible');
	});
	await page.goto('/');
	const html = page.locator('html');
	const toggle = page.getByRole('button', { name: /visual mode/i });

	// Wait for client hydration so the toggle's handler is attached before we interact.
	// (A real user cannot click within milliseconds of load; this removes the harness-only race.)
	await expect(html).toHaveAttribute('data-hydrated', 'true');

	await expect(html).toHaveAttribute('data-mode', 'accessible');
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	// Runtime target-size gate (MODE-01, WCAG 2.5.8 Target Size >= 44x44 CSS px).
	const box = await toggle.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeGreaterThanOrEqual(44);
	expect(box!.height).toBeGreaterThanOrEqual(44);

	await toggle.click();
	await expect(html).toHaveAttribute('data-mode', 'premium');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');

	await page.reload();
	await expect(html).toHaveAttribute('data-mode', 'premium');
	expect(await page.evaluate(() => localStorage.getItem('did-mode'))).toBe('premium');
});

test('switch announces via polite live region and preserves focus + scroll (MODE-05)', async ({
	page
}) => {
	// Seed a deterministic starting mode (accessible) so the switch direction (→ premium) is
	// stable regardless of the runner's ambient prefers-reduced-motion / prefers-contrast
	// defaults, which otherwise decide the no-stored-choice default mode.
	await page.addInitScript(() => {
		if (!localStorage.getItem('did-mode')) localStorage.setItem('did-mode', 'accessible');
	});
	await page.goto('/');
	const toggle = page.getByRole('button', { name: /visual mode/i });

	// Wait for client hydration so the toggle's handler is attached before we interact.
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

	// Focus the toggle, then capture focus identity + scroll BEFORE the switch.
	// The toggle is the only [aria-pressed] button, so element-identity is a stable
	// key even though the aria-label text changes when the mode flips.
	await toggle.focus();
	const focusedBefore = await page.evaluate(
		() => document.activeElement === document.querySelector('button[aria-pressed]')
	);
	const scrollBefore = await page.evaluate(() => window.scrollY);

	// Toggling is an attribute flip (not a navigation), so focus + scroll must survive.
	await toggle.click();

	await expect(page.locator('[role="status"][aria-live="polite"]')).toHaveText(/premium/i);

	const focusedAfter = await page.evaluate(
		() => document.activeElement === document.querySelector('button[aria-pressed]')
	);
	const scrollAfter = await page.evaluate(() => window.scrollY);

	expect(focusedBefore).toBe(true);
	expect(focusedAfter).toBe(true); // focus preserved on the toggle across the switch
	expect(scrollAfter).toBe(scrollBefore); // scroll position unchanged
});

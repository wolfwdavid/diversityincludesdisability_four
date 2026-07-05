import { test, expect } from '@playwright/test';

// A11Y-05 (WCAG 2.1.1 Keyboard, 2.1.2 No Trap, 3.2.6 Consistent Help, 4.1.2 Name/Role/Value):
// at mobile width the disclosure button opens/closes the nav via aria-expanded, Escape closes it
// and returns focus to the button, the active route link exposes aria-current="page", and Tab
// never traps the user inside the menu.

test.use({ viewport: { width: 375, height: 800 } });

test('mobile nav: button toggles aria-expanded and navigation sets aria-current', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

	const toggle = page.getByRole('button', { name: /menu/i });
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');

	// `exact: true` targets ONLY the primary-nav "About" link. Without it the accessible-name
	// substring match also picks up the Home page's founder link "About Eman Rimawi", which is a
	// strict-mode violation (two matches) and unrelated to nav behavior.
	const about = page.getByRole('link', { name: 'About', exact: true });
	await about.click();
	await expect(page).toHaveURL(/\/about\/$/);

	// The mobile nav is an APG Disclosure that auto-closes on route change (correct behavior —
	// RESEARCH Pattern 4). Once closed, the nav list is display:none, so its links leave the
	// accessibility tree and getByRole can no longer see them. Re-open the disclosure on the
	// destination page to verify the now-active link exposes aria-current="page". This asserts
	// the real requirement (active link is marked) without fighting the correct auto-close.
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
		'aria-current',
		'page'
	);
});

test('mobile nav: Escape closes the menu and restores focus to the button', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

	const toggle = page.getByRole('button', { name: /menu/i });
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');

	await page.keyboard.press('Escape');
	await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	await expect(toggle).toBeFocused();
});

test('mobile nav: no keyboard trap — Tab cycles through nav links then out', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');

	const toggle = page.getByRole('button', { name: /menu/i });
	await toggle.focus();
	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-expanded', 'true');

	// Walk forward with Tab a bounded number of times; focus must be able to leave the nav
	// (a trap would keep :focus inside <nav> forever). We assert focus escapes the nav landmark.
	let escapedNav = false;
	for (let i = 0; i < 12; i++) {
		await page.keyboard.press('Tab');
		const inNav = await page.evaluate(() => !!document.activeElement?.closest('nav'));
		if (!inNav) {
			escapedNav = true;
			break;
		}
	}
	expect(escapedNav).toBe(true);
});

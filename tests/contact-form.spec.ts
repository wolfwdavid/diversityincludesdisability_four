import { test, expect } from '@playwright/test';

// DEFAULT build has no PUBLIC_WEB3FORMS_KEY → the form must NOT render, and the labeled mailto
// must remain the primary contact method. Scope mailto assertion to <main> (the footer also
// renders a mailto site-wide).
test('no key → contact form is hidden', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.locator('form.cf')).toHaveCount(0);
});

test('no key → mailto stays primary in the contact main', async ({ page }) => {
	await page.goto('/contact/');
	const mail = page.locator('main a[href^="mailto:emanrimawi@gmail.com"]');
	await expect(mail).toHaveCount(1);
	await expect(mail).toBeVisible();
});

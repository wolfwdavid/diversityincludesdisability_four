import { test, expect } from '@playwright/test';

// A11Y-06 (WCAG 1.1.1 Non-text Content): every <img> carries an alt attribute (empty alt is a
// valid decorative signal, a missing one is not), and every social link exposes a non-empty
// accessible name via aria-label or visible text (no icon-only, name-less links).
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'] as const;

for (const route of ROUTES)
	test(`alt: every image has an alt attribute and social links are named on ${route}`, async ({
		page
	}) => {
		await page.goto(route);

		const imgsMissingAlt = await page.locator('img:not([alt])').count();
		expect(imgsMissingAlt).toBe(0);

		const socialLinks = page.locator('a[rel~="me"]');
		for (const l of await socialLinks.all()) {
			const name = (await l.getAttribute('aria-label')) || (await l.innerText());
			expect(name?.trim()).toBeTruthy();
		}
	});

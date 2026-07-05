import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Every content route in the site. trailingSlash is 'always', so URLs carry a trailing slash.
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'] as const;
// The two togglable experiences. Both must pass the same WCAG gate — Accessible mode is not a
// degraded fallback, so it is held to the identical (AAA-inclusive) axe bar as Premium.
const MODES = ['accessible', 'premium'] as const;

for (const route of ROUTES)
	for (const m of MODES)
		test(`axe: zero violations on ${route} in ${m} mode`, async ({ page }) => {
			await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
			await page.goto(route);
			await expect(page.locator('html')).toHaveAttribute('data-mode', m);
			const { violations } = await new AxeBuilder({ page })
				// wcag2aaa runs axe's color-contrast-enhanced (AAA >=7:1) rule, so the automated
				// suite re-verifies the DS-01 AAA claim on every route in both modes, not just a
				// manual contrast table. This is the AAA gate — keep the tag.
				.withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
				.analyze();
			expect(violations).toEqual([]);
		});

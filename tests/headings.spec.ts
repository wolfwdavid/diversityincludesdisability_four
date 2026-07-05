import { test, expect } from '@playwright/test';

// A11Y-02 (WCAG 1.3.1 Info and Relationships): each route has exactly one <h1> and its
// heading outline never jumps more than one level deeper at a time (no h2 -> h4 skips).
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'] as const;

for (const route of ROUTES)
	test(`headings: single h1 + no skipped levels on ${route}`, async ({ page }) => {
		await page.goto(route);
		await expect(page.locator('h1')).toHaveCount(1);

		const levels = await page
			.locator('h1,h2,h3,h4,h5,h6')
			.evaluateAll((els) => els.map((e) => Number(e.tagName[1])));

		for (let i = 1; i < levels.length; i++)
			// A heading may stay level, go shallower by any amount, or go one level deeper —
			// but never jump more than +1 deeper than its predecessor.
			expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
	});

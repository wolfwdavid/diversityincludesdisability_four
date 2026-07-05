import { test, expect } from '@playwright/test';

// CONT-07 (WCAG 1.4.10 Reflow): every route reflows without horizontal scrolling down to 320px,
// and at 375px the mobile disclosure button is visible (the nav collapses into it).
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'] as const;
const WIDTHS = [
	{ width: 320, height: 720 },
	{ width: 375, height: 800 }
] as const;

for (const route of ROUTES)
	for (const vp of WIDTHS)
		test(`responsive: no horizontal scroll on ${route} @${vp.width}px`, async ({ page }) => {
			await page.setViewportSize(vp);
			await page.goto(route);
			const overflow = await page.evaluate(() => {
				const el = document.documentElement;
				return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
			});
			expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
		});

for (const route of ROUTES)
	test(`responsive: mobile menu button visible on ${route} @375px`, async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto(route);
		await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
	});

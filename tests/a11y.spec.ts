import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const m of ['accessible', 'premium'] as const) {
	test(`axe: zero violations in ${m} mode`, async ({ page }) => {
		await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', m);
		const { violations } = await new AxeBuilder({ page })
			// wcag2aaa runs axe's color-contrast-enhanced (AAA >=7:1) rule, so the
			// automated suite re-verifies the DS-01 AAA claim, not just a manual table.
			.withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(violations).toEqual([]);
	});
}

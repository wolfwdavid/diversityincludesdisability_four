import { test, expect } from '@playwright/test';

// CONT-01..05 + A11Y-07 + PREM-03: each route renders its required, real content blocks — and
// the Accessible-first site ships ZERO WebGL, so no route may contain a <canvas>.

test('home (/) renders hero, mission, 4 service cards, a Connect CTA, and no canvas (CONT-01, PREM-03)', async ({
	page
}) => {
	await page.goto('/');

	await expect(page.locator('.hero h1')).toBeVisible();
	// Mission statement copy present somewhere in the page.
	await expect(page.getByText(/mission/i).first()).toBeVisible();
	// Exactly four service cards on the home overview.
	await expect(page.locator('.service-card')).toHaveCount(4);
	// A "Let's Connect" call to action link. The Home design surfaces this CTA in several places
	// (hero, each service card, and the closing CTA band), so assert the first is visible rather
	// than a single strict match.
	await expect(page.getByRole('link', { name: /let'?s connect/i }).first()).toBeVisible();
	// PREM-03: zero WebGL shipped this phase — no <canvas> in the DOM, even in this default mode.
	await expect(page.locator('canvas')).toHaveCount(0);
});

test('/about renders the "About Eman Rimawi" h1 and body paragraphs (CONT-02)', async ({ page }) => {
	await page.goto('/about/');
	await expect(page.getByRole('heading', { level: 1, name: /about eman rimawi/i })).toBeVisible();
	// At least a couple of body paragraphs of real copy.
	expect(await page.locator('main p').count()).toBeGreaterThanOrEqual(2);
});

test('/services renders 4 service sections each with body text (CONT-03)', async ({ page }) => {
	await page.goto('/services/');
	const sections = page.locator('main h2');
	await expect(sections).toHaveCount(4);
	// Each service section is followed by descriptive body copy.
	for (let i = 0; i < 4; i++) {
		const body = sections.nth(i).locator('xpath=following-sibling::p[1]');
		await expect(body).not.toHaveText('');
	}
});

test('/contact has a named mailto to emanrimawi@gmail.com and 4 social links (CONT-04, CONT-05)', async ({
	page
}) => {
	await page.goto('/contact/');
	// Scope to <main>: the persistent SiteFooter (03-03) also renders a mailto + SocialLinks on
	// every page, so page-wide counts double. The /about and /services tests above scope to main
	// for the same reason — assert the contact PAGE's own primary contact block here.
	const main = page.locator('main');
	const mail = main.locator('a[href^="mailto:emanrimawi@gmail.com"]');
	await expect(mail).toHaveCount(1);
	const mailName = (await mail.getAttribute('aria-label')) || (await mail.innerText());
	expect(mailName?.trim()).toBeTruthy();
	// Four social links in main, each carrying rel="me".
	await expect(main.locator('a[rel~="me"]')).toHaveCount(4);
});

test('/accessibility states a conformance target, a feedback mailto, and a review cadence (A11Y-07)', async ({
	page
}) => {
	await page.goto('/accessibility/');
	// Conformance target — WCAG 2.2 AA/AAA language.
	await expect(page.getByText(/wcag\s*2\.2/i).first()).toBeVisible();
	// A feedback mailto anywhere on the page.
	await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
	// Review cadence text (e.g. "reviewed", "annually", a date).
	await expect(page.getByText(/review(ed)?/i).first()).toBeVisible();
});

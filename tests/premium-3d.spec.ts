import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Consolidated Phase-4 premium runtime assertions (PREM-01/02/04).
//
// These are authored GREEN-shaped but are intentionally RED until the Threlte scene ships in
// Plans 04-02/04-03 — they are the drive-green target for those waves. Wave-1 acceptance is
// only that they are authored, type/lint-clean, and listable via `playwright --list`.
//
// Harness conventions (from tests/a11y.spec.ts, tests/mode-toggle.spec.ts):
//   - seed mode via addInitScript writing localStorage 'did-mode' BEFORE navigation
//   - wait for hydration: html[data-hydrated="true"]
//   - routes carry a trailing slash (trailingSlash: 'always') → About is /about/
//   - pin reducedMotion per-test (Playwright default is 'no-preference')

const seed = (page: Page, m: 'accessible' | 'premium') =>
	page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);

test('PREM-01/03 accessible mode: no canvas, poster present', async ({ page }) => {
	await seed(page, 'accessible');
	await page.goto('/');
	await expect(page.locator('canvas')).toHaveCount(0);
	await expect(page.locator('.hero__poster')).toBeVisible();
});

test('PREM-01/03 premium + reduced-motion: poster, still no canvas (SC-1)', async ({ page }) => {
	await seed(page, 'premium');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expect(page.locator('canvas')).toHaveCount(0);
	await expect(page.locator('.hero__poster')).toBeVisible();
});

test('PREM-01 premium + motion: canvas mounts, decorative, axe clean', async ({ page }) => {
	await seed(page, 'premium');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	const canvas = page.locator('canvas');
	await expect(canvas).toBeVisible();
	// decorative: the canvas (or its wrapper) is aria-hidden and never in the tab order
	await expect(page.locator('[aria-hidden="true"] canvas, canvas[aria-hidden="true"]')).toHaveCount(
		1
	);
	const { violations } = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
		.analyze();
	expect(violations).toEqual([]);
});

test('PREM-02 accessible mode downloads zero three chunks', async ({ page }) => {
	const bodies: string[] = [];
	page.on('response', async (r) => {
		if (r.url().endsWith('.js')) bodies.push(await r.text().catch(() => ''));
	});
	await seed(page, 'accessible');
	await page.goto('/', { waitUntil: 'networkidle' });
	await expect(page.locator('canvas')).toHaveCount(0);
	expect(bodies.some((b) => /@threlte|THREE\.WebGLRenderer/.test(b))).toBe(false);
});

test('PREM-02 premium+motion downloads a three chunk and mounts a canvas', async ({ page }) => {
	const bodies: string[] = [];
	page.on('response', async (r) => {
		if (r.url().endsWith('.js')) bodies.push(await r.text().catch(() => ''));
	});
	await seed(page, 'premium');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	await expect(page.locator('canvas')).toBeVisible();
	expect(bodies.some((b) => /@threlte|THREE\.WebGLRenderer/.test(b))).toBe(true);
});

test('PREM-04 nav away/back x15 disposes cleanly — no WebGL context leak', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (m) => {
		if (/too many active webgl|context lost/i.test(m.text())) errors.push(m.text());
	});
	await seed(page, 'premium');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
	for (let i = 0; i < 15; i++) {
		await expect(page.locator('canvas')).toBeVisible();
		await page.getByRole('link', { name: /about/i }).first().click();
		await expect(page).toHaveURL(/\/about\/?$/);
		await expect(page.locator('canvas')).toHaveCount(0);
		await page.goBack();
	}
	expect(errors).toEqual([]);
});

test('PREM-04 forced context loss -> poster fallback, no crash, content intact', async ({
	page
}) => {
	await seed(page, 'premium');
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('canvas')).toBeVisible();
	await page.evaluate(() => {
		const c = document.querySelector('canvas') as HTMLCanvasElement;
		(c.getContext('webgl2') || c.getContext('webgl'))
			?.getExtension('WEBGL_lose_context')
			?.loseContext();
	});
	await expect(page.locator('.hero__poster')).toBeVisible();
	await expect(page.locator('h1')).toBeVisible();
});

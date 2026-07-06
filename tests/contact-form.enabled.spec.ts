import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MODES = ['accessible', 'premium'] as const;

test('enabled build renders the form (dummy key baked at build)', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.locator('form.cf')).toBeVisible();
});

test('fields have visible labels + autocomplete attrs', async ({ page }) => {
	await page.goto('/contact/');
	await expect(page.getByLabel('Your name')).toHaveAttribute('autocomplete', 'name');
	await expect(page.getByLabel('Your email')).toHaveAttribute('autocomplete', 'email');
	await expect(page.getByLabel('Your message')).toBeVisible();
});

test('honeypot is present but invisible to assistive tech', async ({ page }) => {
	await page.goto('/contact/');
	const hp = page.locator('input[name="botcheck"]');
	await expect(hp).toHaveCount(1);
	await expect(hp).toHaveAttribute('tabindex', '-1');
	// Wrapped in an aria-hidden container → out of the a11y tree.
	await expect(page.locator('[aria-hidden="true"] input[name="botcheck"]')).toHaveCount(1);
});

test('on-blur validation links errors via aria-describedby', async ({ page }) => {
	await page.goto('/contact/');
	const name = page.getByLabel('Your name');
	await name.focus();
	await name.blur();
	const err = page.locator('#cf-name-error');
	await expect(err).toBeVisible();
	await expect(name).toHaveAttribute('aria-describedby', 'cf-name-error');
	await expect(name).toHaveAttribute('aria-invalid', 'true');
});

test('submit with invalid fields moves focus to the first invalid field', async ({ page }) => {
	await page.goto('/contact/');
	await page.locator('form.cf button[type="submit"]').click();
	await expect(page.getByLabel('Your name')).toBeFocused();
});

test('successful submit forwards the bound honeypot field + announces via aria-live (network stubbed)', async ({
	page
}) => {
	let posted: any = null;
	await page.route('**/api.web3forms.com/**', (r) => {
		posted = r.request().postDataJSON();
		return r.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, message: 'ok' })
		});
	});
	await page.goto('/contact/');
	await page.getByLabel('Your name').fill('Test Person');
	await page.getByLabel('Your email').fill('test@example.com');
	await page.getByLabel('Your message').fill('This is a message of sufficient length.');
	await page.locator('form.cf button[type="submit"]').click();
	await expect(page.locator('#cf-status')).toContainText(/sent|thank/i);
	// WARNING 1: honeypot value is BOUND and forwarded (a real human left it unticked → false).
	expect(posted).toHaveProperty('botcheck', false);
});

test('failed submit announces error with retry + mailto fallback (network stubbed)', async ({
	page
}) => {
	await page.route('**/api.web3forms.com/**', (r) =>
		r.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: false, message: 'nope' })
		})
	);
	await page.goto('/contact/');
	await page.getByLabel('Your name').fill('Test Person');
	await page.getByLabel('Your email').fill('test@example.com');
	await page.getByLabel('Your message').fill('This is a message of sufficient length.');
	await page.locator('form.cf button[type="submit"]').click();
	const status = page.locator('#cf-status');
	await expect(status).toContainText(/wrong|error/i);
	await expect(status.getByRole('button', { name: /retry/i })).toBeVisible();
	await expect(status.locator('a[href^="mailto:emanrimawi@gmail.com"]')).toBeVisible();
});

test('submit button + inputs are >=44px tall', async ({ page }) => {
	await page.goto('/contact/');
	for (const sel of ['#cf-name', '#cf-message', 'form.cf button[type="submit"]']) {
		const box = await page.locator(sel).boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
	}
});

for (const m of MODES) {
	test(`axe: zero violations on /contact with the form in ${m} mode`, async ({ page }) => {
		await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
		await page.goto('/contact/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', m);
		await expect(page.locator('form.cf')).toBeVisible();
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(violations).toEqual([]);
	});
}

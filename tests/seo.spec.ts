import { test, expect } from '@playwright/test';

const SITE_URL = 'https://wolfwdavid.github.io';
const ORG = 'Diversity Includes Disability';
const ROUTES = [
	{ path: '/', title: ORG, home: true },
	{ path: '/about/', title: 'About Eman Rimawi', home: false },
	{ path: '/services/', title: 'Services', home: false },
	{ path: '/contact/', title: 'Contact', home: false },
	{ path: '/accessibility/', title: 'Accessibility Statement', home: false }
];

for (const r of ROUTES) {
	test(`SEO meta present and correct — ${r.path}`, async ({ page }) => {
		await page.goto(r.path);
		const fullTitle = r.home ? ORG : `${r.title} | ${ORG}`;
		await expect(page).toHaveTitle(fullTitle);

		const desc = page.locator('head meta[name="description"]');
		await expect(desc).toHaveCount(1);
		expect(((await desc.getAttribute('content')) ?? '').length).toBeGreaterThan(20);

		// base='' in preview → canonical/og:url are origin+path (repo segment is asserted by the build-grep gate)
		const url = `${SITE_URL}${r.path}`;
		await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', url);
		await expect(page.locator('head meta[property="og:type"]')).toHaveAttribute('content', 'website');
		await expect(page.locator('head meta[property="og:site_name"]')).toHaveAttribute('content', ORG);
		await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute('content', fullTitle);
		await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', url);
		await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute(
			'content',
			`${SITE_URL}/og-image.png`
		);
		await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute(
			'content',
			'summary_large_image'
		);
		await expect(page.locator('head meta[name="twitter:image"]')).toHaveAttribute(
			'content',
			`${SITE_URL}/og-image.png`
		);
	});
}

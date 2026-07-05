// Reproducible one-off rasterizer for the OG social card.
// Renders static/og-image.svg to a 1200x630 static/og-image.png using the already-installed
// Playwright chromium (no new dependency). The PNG is a committed static asset, NOT a build step —
// re-run this only when og-image.svg changes: `node scripts/gen-og-image.mjs`.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync('static/og-image.svg', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1200, height: 630 },
	deviceScaleFactor: 1
});
await page.setContent(`<!doctype html><style>*{margin:0;padding:0}</style>${svg}`, {
	waitUntil: 'networkidle'
});
await page.screenshot({
	path: 'static/og-image.png',
	clip: { x: 0, y: 0, width: 1200, height: 630 }
});
await browser.close();
console.log('wrote static/og-image.png (1200x630)');

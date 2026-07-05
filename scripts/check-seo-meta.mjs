import { readFileSync } from 'node:fs';

const ORIGIN = 'https://wolfwdavid.github.io';
const BASE = '/diversityincludesdisability_four';
const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'];
const IMG = `${ORIGIN}${BASE}/og-image.png`;
const fails = [];

for (const r of ROUTES) {
	const file = `build${r}index.html`;
	let html;
	try {
		html = readFileSync(file, 'utf8');
	} catch {
		fails.push(`missing ${file} — build with BASE_PATH=${BASE}`);
		continue;
	}

	const canonical = `${ORIGIN}${BASE}${r}`;
	const need = [
		canonical, // absolute base-path URL (canonical + og:url share it)
		IMG, // og:image absolute under base
		'rel="canonical"',
		'name="description"',
		'<title>',
		'og:type',
		'og:site_name',
		'og:title',
		'og:description',
		'og:url',
		'og:image',
		'twitter:card',
		'twitter:title',
		'twitter:description',
		'twitter:image'
	];
	for (const n of need) if (!html.includes(n)) fails.push(`${file}: missing ${n}`);
	if (!html.includes('content="summary_large_image"'))
		fails.push(`${file}: twitter card not summary_large_image`);
}
if (fails.length) {
	console.error('SEO META FAIL:\n' + fails.join('\n'));
	process.exit(1);
}
console.log('SEO META OK: all 5 routes carry absolute base-path canonical/OG/Twitter meta');

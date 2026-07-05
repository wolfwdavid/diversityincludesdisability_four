// DEPLOY-04 live smoke. Node 24 global fetch — no dependency. Base URL from arg or env.
// Verifies the DEPLOYED site under its base path: every route resolves, an _app/immutable
// chunk resolves, the SPA 404 fallback shell is served, and no Google Fonts are referenced.
// Retries with backoff to absorb GitHub Pages CDN propagation after a fresh deploy.
const BASE = (
	process.argv[2] ||
	process.env.SMOKE_URL ||
	'https://wolfwdavid.github.io/diversityincludesdisability_four'
).replace(/\/$/, '');

const ROUTES = ['/', '/about/', '/services/', '/contact/', '/accessibility/'];
const get = (u) => fetch(u, { redirect: 'follow' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runChecks() {
	const fails = [];

	for (const r of ROUTES) {
		const res = await get(BASE + r);
		if (res.status !== 200) fails.push(`route ${r} -> ${res.status}`);
	}

	const homeHtml = await (await get(BASE + '/')).text();
	if (/fonts\.(googleapis|gstatic)\.com/.test(homeHtml)) fails.push('google fonts reference found');

	// _app/immutable chunk URLs are absolute + base-prefixed (paths.relative=false), so stripping
	// BASE re-composes a clean fetchable URL.
	const m = homeHtml.match(/\/_app\/immutable\/[^"']+\.js/);
	if (!m) {
		fails.push('no _app/immutable chunk referenced in home html');
	} else {
		const asset = await get(BASE + m[0].replace(BASE, ''));
		if (asset.status !== 200) fails.push(`asset ${m[0]} -> ${asset.status}`);
		else if (!/javascript|ecmascript/.test(asset.headers.get('content-type') || ''))
			fails.push(`asset ${m[0]} bad content-type "${asset.headers.get('content-type')}"`);
	}

	// GitHub Pages serves 404.html (the SvelteKit SPA shell) for unknown deep links with a 404
	// status — assert on BODY content (the app shell markers), not status.
	const spa = await get(BASE + '/definitely-not-a-real-page-xyz/');
	const spaBody = await spa.text();
	if (!/_app\/immutable|data-mode/.test(spaBody)) fails.push('SPA 404 fallback shell not served');

	return fails;
}

// Retry the whole check set to ride out CDN propagation lag right after a deploy.
const MAX_ATTEMPTS = Number(process.env.SMOKE_ATTEMPTS || 5);
let fails = [];
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
	try {
		fails = await runChecks();
	} catch (err) {
		fails = [`fetch error: ${err.message}`];
	}
	if (!fails.length) break;
	if (attempt < MAX_ATTEMPTS) {
		const waitMs = attempt * 5000;
		console.error(`attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${waitMs / 1000}s...`);
		await sleep(waitMs);
	}
}

if (fails.length) {
	console.error('SMOKE FAIL:\n' + fails.join('\n'));
	process.exit(1);
}
console.log('SMOKE OK: all routes 200, asset 200, SPA fallback shell, no google fonts');

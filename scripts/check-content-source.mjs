// CONT-06 + base-path safety gate (source-only; no build required).
// Modeled on scripts/check-no-raw-hex.mjs — Node fs walker, forward-slash normalized paths,
// process.exit(1) on failure. Windows/pnpm-safe (no rg, no bash).
//
// 1) Every src/routes/**/+page.svelte must import the content module (substring "content/site"),
//    so no page forks its own hardcoded copy (single source of truth).
// 2) No src/**/*.svelte may contain a literal absolute internal link `href="/` — those break under
//    the GitHub Pages base path. Internal links must use resolve() (`href={...}`). Allowed literal
//    href forms are `href="#`, `href="mailto:`, and expression hrefs `href={`.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];

function walk(dir, onFile) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name).split('\\').join('/');
		if (entry.isDirectory()) {
			walk(p, onFile);
			continue;
		}
		onFile(p);
	}
}

// (1) Pages must source copy from site.ts.
walk('src/routes', (p) => {
	if (!p.endsWith('+page.svelte')) return;
	const src = readFileSync(p, 'utf8');
	if (!src.includes('content/site')) {
		failures.push(`${p}: page does not import the content module ('$lib/content/site')`);
	}
});

// (2) No hardcoded absolute internal links anywhere in Svelte source.
walk('src', (p) => {
	if (!p.endsWith('.svelte')) return;
	readFileSync(p, 'utf8')
		.split('\n')
		.forEach((line, i) => {
			if (line.includes('href="/')) {
				failures.push(
					`${p}:${i + 1}: hardcoded absolute internal link — use resolve() instead: ${line.trim()}`
				);
			}
		});
});

if (failures.length) {
	console.error('FAIL: content-source / base-path check:\n' + failures.join('\n'));
	process.exit(1);
}
console.log('OK: content sourced from site.ts, no hardcoded base-breaking links');

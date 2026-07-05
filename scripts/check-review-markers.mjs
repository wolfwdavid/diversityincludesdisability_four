// Build gate: no "[REVIEW" marker may reach the shipped HTML.
// Modeled on scripts/check-no-raw-hex.mjs — Node fs walker, forward-slash normalized paths,
// process.exit(1) on failure. Run AFTER `pnpm build` (walks build/**/*.html).
//
// [REVIEW: ...] markers are authored ONLY as TS comments in src/lib/content/site.ts; the compiler
// strips them, so a hit here means a placeholder leaked into a rendered string — a release blocker
// on a real activist's site.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

if (!existsSync('build')) {
	console.error('FAIL: build/ not found — run `pnpm build` before this check.');
	process.exit(1);
}

const failures = [];

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name).split('\\').join('/');
		if (entry.isDirectory()) {
			walk(p);
			continue;
		}
		if (!p.endsWith('.html')) continue;
		readFileSync(p, 'utf8')
			.split('\n')
			.forEach((line, i) => {
				if (line.includes('[REVIEW')) failures.push(`${p}:${i + 1}: ${line.trim()}`);
			});
	}
}

walk('build');

if (failures.length) {
	console.error('FAIL: "[REVIEW" marker leaked into built HTML:\n' + failures.join('\n'));
	process.exit(1);
}
console.log('OK: no [REVIEW markers in built HTML');

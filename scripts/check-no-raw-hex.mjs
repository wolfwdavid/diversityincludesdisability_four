import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
const ALLOW = ['src/lib/styles/tokens.css'];
// Quarantined WebGL scene — code-split OUT of the Accessible bundle. These files may use
// token-derived three.Color hex constants (e.g. #6FB4FF / #FF9E5E), so the accessible
// raw-hex contract does not apply to them. Keep the exemption narrow (premium/ only).
const ALLOW_DIRS = ['src/lib/components/premium/'];
const EXT = ['.svelte', '.css'];
const failures = [];

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name).split('\\').join('/');
		if (entry.isDirectory()) {
			walk(p);
			continue;
		}
		if (ALLOW_DIRS.some((d) => p.startsWith(d))) continue;
		if (!EXT.some((e) => p.endsWith(e))) continue;
		if (ALLOW.includes(p)) continue;
		readFileSync(p, 'utf8')
			.split('\n')
			.forEach((line, i) => {
				if (HEX.test(line)) failures.push(`${p}:${i + 1}: ${line.trim()}`);
			});
	}
}

walk('src');
if (failures.length) {
	console.error('FAIL: raw hex outside tokens.css:\n' + failures.join('\n'));
	process.exit(1);
}
console.log('OK: components use tokens, no raw hex');

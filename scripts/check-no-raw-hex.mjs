import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
const ALLOW = ['src/lib/styles/tokens.css'];
const EXT = ['.svelte', '.css'];
const failures = [];

function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name).split('\\').join('/');
		if (entry.isDirectory()) {
			walk(p);
			continue;
		}
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

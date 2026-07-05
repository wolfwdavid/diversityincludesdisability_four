import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// PREM-02 build-grep proof (content-based, not name-based).
// After a build this gate:
//   1. finds every JS chunk whose CONTENT contains three/@threlte and asserts >=1 exists
//      (the premium scene is split into its own chunk — proves the code is present but separate);
//   2. parses the prerendered Accessible entry (build/index.html = Home) and asserts NONE of the
//      chunks it references (modulepreload / module scripts) is a premium chunk
//      (proves WebGL is not in the Accessible critical path).
// Exit non-zero on either failure.
//
// EXPECTED RED until Plan 04-03 ships the scene: with no dynamic import() of a three-importing
// module, no premium chunk exists yet, so part (1) fails with a clear "no premium chunk" message.

const DIR = 'build/_app/immutable';
const MARK = /@threlte|WebGLRenderer|three\.module/;

const js = [];
(function walk(d) {
	for (const e of readdirSync(d, { withFileTypes: true })) {
		const p = join(d, e.name);
		if (e.isDirectory()) {
			walk(p);
		} else if (e.name.endsWith('.js')) {
			js.push(p);
		}
	}
})(DIR);

const premium = js.filter((f) => MARK.test(readFileSync(f, 'utf8')));
if (premium.length === 0) {
	console.error('FAIL: no three/@threlte chunk found — split missing or scene not built');
	process.exit(1);
}

// build/index.html is the prerendered Accessible entry (Home). Collect the chunks it
// preloads/loads and assert none is a premium chunk (three not in the critical path).
const home = readFileSync('build/index.html', 'utf8');
const referenced = [...home.matchAll(/_app\/immutable\/[^"']+\.js/g)].map((m) => m[0]);
const leaked = referenced.filter((r) => premium.some((p) => p.replace(/\\/g, '/').endsWith(r)));
if (leaked.length) {
	console.error('FAIL: three/@threlte reachable from home critical bundle:\n' + leaked.join('\n'));
	process.exit(1);
}
console.log(`OK: ${premium.length} premium chunk(s) split out; home bundle is WebGL-free`);

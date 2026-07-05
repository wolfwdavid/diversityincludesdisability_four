// Cross-platform BASE_PATH build for the GitHub Pages artifact.
// svelte.config.js reads `paths.base` from process.env.BASE_PATH. Setting that inline on a
// shell command line is fragile: cmd.exe rejects `VAR=val cmd`, and Git Bash mangles the
// leading-slash value (MSYS path conversion turns `/diversityincludesdisability_four` into a
// Windows path). Setting it in Node here is identical on Windows, Git Bash, and Linux CI.
// The base defaults to the package name (matching CI's `/${{ repository.name }}`), or an
// explicit BASE_PATH override wins.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const base = process.env.BASE_PATH || `/${pkg.name}`;

const env = { ...process.env, BASE_PATH: base };
console.log(`build-base: building with BASE_PATH=${base}`);

const res = spawnSync('vite', ['build'], {
	stdio: 'inherit',
	env,
	shell: true
});

process.exit(res.status ?? 1);

import { readFileSync } from 'node:fs';

// QA-01 / DEPLOY-04 static gate. Asserts .github/workflows/deploy.yml still wires the launch
// pipeline: a `verify` job (Playwright axe both modes + Lighthouse budgets) that gates build and
// deploy, the Follow-up-1 guarded deploy1/deploy2 retry pair, and the post-deploy live-smoke job
// with CDN-propagation retry. A future edit that silently drops the gate fails this check.
const wf = readFileSync('.github/workflows/deploy.yml', 'utf8');
const need = [
	['verify job', /verify:/],
	['playwright browser install', /playwright install --with-deps chromium/],
	['axe/e2e gate', /pnpm test:e2e/],
	['lighthouse budget', /lhci autorun/],
	['build gated on verify', /needs: verify/],
	['deploy gated on build', /needs: build/],
	['guarded deploy retry', /continue-on-error: true/],
	['deploy retry guard', /steps\.deploy1\.outcome == 'failure'/],
	['smoke gated on deploy', /smoke:[\s\S]*needs: deploy/],
	['smoke retry action', /nick-fields\/retry@v4/],
	['smoke runs live-smoke', /scripts\/live-smoke\.mjs/]
];
const fails = need.filter(([, re]) => !re.test(wf)).map(([label]) => label);
if (fails.length) {
	console.error('CI GATE FAIL: deploy.yml missing:\n- ' + fails.join('\n- '));
	process.exit(1);
}

// Phase-6 ordering invariant (RESEARCH Pitfall 6 / 06-04): the enabled contact-form suite
// rebuilds build/ with the dummy PUBLIC_WEB3FORMS_KEY, and lhci serves staticDistDir='build'.
// So `pnpm test:e2e:enabled` MUST run strictly AFTER `lhci autorun` in the verify job, or
// Lighthouse would silently audit the dummy-key build. Assert presence + index order.
const lhciIdx = wf.indexOf('lhci autorun');
const enabledIdx = wf.indexOf('pnpm test:e2e:enabled');
const unitIdx = wf.indexOf('pnpm test:unit');
if (unitIdx < 0 || enabledIdx < 0) {
	console.error(
		'CI GATE FAIL: verify job must run both `pnpm test:unit` and `pnpm test:e2e:enabled`.'
	);
	process.exit(1);
}
if (enabledIdx < lhciIdx) {
	console.error(
		'CI GATE FAIL: `pnpm test:e2e:enabled` must appear AFTER `lhci autorun` — the enabled ' +
			'suite rebuilds build/ with the dummy key and would pollute the Lighthouse audit.'
	);
	process.exit(1);
}

console.log(
	'CI GATE OK: verify(axe+lhci -> unit -> enabled) -> build -> deploy(retry) -> smoke all present'
);

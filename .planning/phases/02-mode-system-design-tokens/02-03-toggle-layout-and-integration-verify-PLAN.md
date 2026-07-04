---
phase: 02-mode-system-design-tokens
plan: 03
type: execute
wave: 3
depends_on: ["01", "02"]
files_modified:
  - src/lib/components/shell/ModeToggle.svelte
  - src/routes/+layout.svelte
  - src/routes/+page.svelte
autonomous: true
requirements: [MODE-01, MODE-05, MODE-04, DS-02]
must_haves:
  truths:
    - "A keyboard user can reach and operate a native <button aria-pressed> mode toggle in the header on every route"
    - "Clicking the toggle flips data-mode + aria-pressed with no navigation; scroll and focus are preserved"
    - "The switch is announced via a persistent role=status aria-live=polite region"
    - "A live OS reduced-motion/contrast change auto-flips mode only when no explicit choice is stored"
    - "Self-hosted fonts load with zero fonts.googleapis.com / fonts.gstatic.com requests"
    - "axe reports zero violations in BOTH accessible and premium mode on the home page"
  artifacts:
    - path: "src/lib/components/shell/ModeToggle.svelte"
      provides: "Native <button aria-pressed> ≥44px, label+icon, calls mode.toggle()"
      contains: "aria-pressed"
    - path: "src/routes/+layout.svelte"
      provides: "Global tokens+font imports, preload links, header+toggle, persistent aria-live announcer, matchMedia listener"
      contains: "aria-live"
    - path: "src/routes/+page.svelte"
      provides: "Token-styled hello-world demo content (no nested <main>, no raw hex)"
      contains: "var(--"
  key_links:
    - from: "src/lib/components/shell/ModeToggle.svelte"
      to: "src/lib/stores/mode.svelte.ts"
      via: "import { mode }; onclick={() => mode.toggle()}"
      pattern: "mode.toggle"
    - from: "src/routes/+layout.svelte"
      to: "@fontsource + tokens.css"
      via: "global CSS imports + Vite-resolved woff2 preload links"
      pattern: "@fontsource"
    - from: "src/routes/+layout.svelte"
      to: "mode.announcement"
      via: "reactive text in role=status region"
      pattern: "mode.announcement"
---

<objective>
Wire the engine (Plan 02) into a visible, keyboard-operable UI: the native ModeToggle button in
a header on every route, global token + self-hosted-font imports with critical-weight preloads,
a persistent aria-live announcer, and the live OS-signal listener. Restyle the hello-world page
with tokens so both modes are visibly demonstrable on one DOM. Finally, turn the Plan 01 specs
GREEN — this task is the phase's integration gate.

Purpose: satisfy MODE-01 (native toggle in header everywhere), MODE-05 (announce + preserve
scroll/focus), MODE-04 live-change half, and DS-02 (token-driven single DOM), then prove the
whole engine via axe + the full Playwright suite.
Output: ModeToggle.svelte, modified +layout.svelte + +page.svelte, all specs green.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md
@.planning/phases/02-mode-system-design-tokens/02-RESEARCH.md
@.planning/phases/02-mode-system-design-tokens/02-VALIDATION.md
@CLAUDE.md
@src/lib/stores/mode.svelte.ts
@src/lib/styles/tokens.css

<constraints>
- Toggle MUST be a real `<button type="button" aria-pressed>` — not a div, not CSS-only (MODE-01).
- Min target ≥44×44px; visible text label + inline SVG icon (never emoji; stroke="currentColor", no hex).
- Switch mode by flipping the attribute via mode.toggle() — NEVER goto()/{#key} (would lose scroll+focus, MODE-05).
- Font preload links MUST include crossorigin="anonymous" (else double-download — RESEARCH Pitfall 3).
- Live matchMedia listener lives in a browser-guarded $effect and auto-flips ONLY when no did-mode is stored.
- No raw hex outside tokens.css (scripts/check-no-raw-hex.mjs gate). Icons use currentColor.
- Layout owns the single <main id="main"> — remove the <main> in +page.svelte to avoid duplicate landmarks (axe).
</constraints>

<interfaces>
<!-- From Plan 02 — consume, do not redefine. -->
import { mode } from '$lib/stores/mode.svelte';
mode.current;       // 'accessible' | 'premium' — read directly, never destructure
mode.announcement;  // string for the aria-live region
mode.toggle();      // flips mode
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create ModeToggle.svelte (native aria-pressed button)</name>
  <files>src/lib/components/shell/ModeToggle.svelte</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 4 ModeToggle — copy verbatim)
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§5 toggle semantics + acceptance)
    - src/lib/stores/mode.svelte.ts (the store contract)
  </read_first>
  <action>
Create `src/lib/components/shell/ModeToggle.svelte` verbatim from RESEARCH Example 4. Native
button, `aria-pressed` bound to `isPremium`, mode-appropriate `aria-label` matching `/visual
mode/i` (what the Plan 01 specs query), label+icon swap, ≥44px min target, focus ring inherited
from the global `:focus-visible` rule. Icon uses `stroke="currentColor"` — no hex.

```svelte
<script lang="ts">
	import { mode } from '$lib/stores/mode.svelte';
	const isPremium = $derived(mode.current === 'premium');
</script>

<button
	type="button"
	class="mode-toggle"
	aria-pressed={isPremium}
	aria-label={isPremium ? 'Switch to Accessible visual mode' : 'Switch to Premium visual mode'}
	onclick={() => mode.toggle()}
>
	<svg class="mode-toggle__icon" aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
		<path d={isPremium ? 'M12 3v2M12 19v2M5 12H3M21 12h-2' : 'M4 12h16M4 6h16M4 18h16'}
			fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	</svg>
	<span class="mode-toggle__label">{isPremium ? 'Premium' : 'Accessible'}</span>
</button>

<style>
	.mode-toggle {
		display: inline-flex; align-items: center; gap: var(--space-2);
		min-height: 44px; min-width: 44px; padding: var(--space-2) var(--space-4);
		background: var(--surface); color: var(--text);
		border: 1px solid var(--border); border-radius: var(--radius-md);
		font: inherit; cursor: pointer; transition: background var(--dur) var(--ease);
	}
	.mode-toggle:hover { background: var(--bg); }
	/* focus ring inherited from global :focus-visible in tokens.css */
</style>
```
  </action>
  <acceptance_criteria>
    - `grep -q 'type="button"' src/lib/components/shell/ModeToggle.svelte && grep -q 'aria-pressed=' src/lib/components/shell/ModeToggle.svelte`
    - `grep -q 'visual mode' src/lib/components/shell/ModeToggle.svelte` (aria-label matches spec query /visual mode/i)
    - `grep -q 'mode.toggle()' src/lib/components/shell/ModeToggle.svelte`
    - `grep -q 'min-height: 44px' src/lib/components/shell/ModeToggle.svelte`
    - `grep -q 'stroke="currentColor"' src/lib/components/shell/ModeToggle.svelte`
    - `node scripts/check-no-raw-hex.mjs` exits 0 (no hex in the component)
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>ModeToggle is a native ≥44px aria-pressed button with label+icon that calls mode.toggle(); compiles clean and passes the token gate.</done>
</task>

<task type="auto">
  <name>Task 2: Wire +layout.svelte (imports, header, announcer, OS listener) and restyle +page.svelte</name>
  <files>src/routes/+layout.svelte, src/routes/+page.svelte</files>
  <read_first>
    - src/routes/+layout.svelte (current: only renders children)
    - src/routes/+page.svelte (current: has its own <main> — must be replaced with token-styled content, no <main>)
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 5 layout — copy verbatim; font naming §"Verified file/CSS naming")
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§5 announcer, §2 fonts)
  </read_first>
  <action>
Replace `src/routes/+layout.svelte` verbatim with RESEARCH Example 5: global imports of
tokens.css + the eight @fontsource latin-weight CSS files, Vite-resolved preload URLs for the
two critical weights (with `crossorigin="anonymous"`), the skip-link, header with brand +
`<ModeToggle>`, the single `<main id="main">`, the persistent `role="status" aria-live="polite"`
announcer bound to `mode.announcement`, and the browser-guarded `$effect` matchMedia listener
that auto-flips only when no `did-mode` is stored.

```svelte
<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { mode } from '$lib/stores/mode.svelte';
	import ModeToggle from '$lib/components/shell/ModeToggle.svelte';
	import favicon from '$lib/assets/favicon.svg';

	import '$lib/styles/tokens.css';
	import '@fontsource/lexend/latin-300.css';
	import '@fontsource/lexend/latin-400.css';
	import '@fontsource/lexend/latin-600.css';
	import '@fontsource/lexend/latin-700.css';
	import '@fontsource/source-sans-3/latin-400.css';
	import '@fontsource/source-sans-3/latin-500.css';
	import '@fontsource/source-sans-3/latin-600.css';
	import '@fontsource/source-sans-3/latin-700.css';

	import lexend700 from '@fontsource/lexend/files/lexend-latin-700-normal.woff2';
	import bodySans400 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2';

	let { children } = $props();

	$effect(() => {
		if (!browser) return;
		const rm = matchMedia('(prefers-reduced-motion: reduce)');
		const hc = matchMedia('(prefers-contrast: more)');
		const onChange = () => {
			if (localStorage.getItem('did-mode')) return;
			mode.set(rm.matches || hc.matches ? 'accessible' : 'premium');
		};
		rm.addEventListener('change', onChange);
		hc.addEventListener('change', onChange);
		return () => {
			rm.removeEventListener('change', onChange);
			hc.removeEventListener('change', onChange);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preload" href={lexend700} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={bodySans400} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<a class="skip-link" href="#main">Skip to main content</a>

<header class="site-header">
	<a class="brand" href="{base}/">Diversity Includes Disability</a>
	<ModeToggle />
</header>

<main id="main">
	{@render children()}
</main>

<p class="visually-hidden" role="status" aria-live="polite">{mode.announcement}</p>

<style>
	.site-header {
		display: flex; align-items: center; justify-content: space-between;
		gap: var(--space-4); padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border); background: var(--surface);
	}
	.brand { color: var(--primary); font-family: var(--font-heading); font-weight: 600; text-decoration: none; }
	#main { padding: var(--space-6) var(--space-5); max-width: var(--measure); margin-inline: auto; }
</style>
```

Then replace `src/routes/+page.svelte` so it contains NO `<main>` (the layout owns it — nested
mains are an axe landmark violation) and demonstrates both modes with tokens only (no raw hex):

```svelte
<script lang="ts">
	import { mode } from '$lib/stores/mode.svelte';
</script>

<h1>Diversity Includes Disability</h1>
<p class="lead">
	One site, two experiences. You are viewing <strong>{mode.current}</strong> mode — use the
	toggle in the header to switch. Your choice is remembered.
</p>
<p>
	This page is intentionally minimal: Phase 2 proves the mode engine and token contract. Full
	content arrives in Phase 3.
</p>

<style>
	h1 { font-size: var(--fs-h1); color: var(--text); }
	.lead { font-size: var(--fs-lg); color: var(--text-muted); }
	p { color: var(--text); line-height: var(--lh-body); }
	strong { color: var(--accent); }
</style>
```
  </action>
  <acceptance_criteria>
    - `grep -q "import '@fontsource/lexend/latin-400.css'" src/routes/+layout.svelte`
    - `grep -q "import '\$lib/styles/tokens.css'" src/routes/+layout.svelte`
    - `grep -q 'crossorigin="anonymous"' src/routes/+layout.svelte` (preload without double-download)
    - `grep -q 'role="status"' src/routes/+layout.svelte && grep -q 'aria-live="polite"' src/routes/+layout.svelte`
    - `grep -q '{mode.announcement}' src/routes/+layout.svelte`
    - `grep -q '<main id="main">' src/routes/+layout.svelte`
    - `grep -q "localStorage.getItem('did-mode')" src/routes/+layout.svelte` (respects explicit choice)
    - `! grep -q '<main' src/routes/+page.svelte` (no duplicate landmark)
    - `grep -q 'var(--' src/routes/+page.svelte` (page styled via tokens)
    - `node scripts/check-no-raw-hex.mjs` exits 0
    - `pnpm check` passes
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>Header renders the toggle on every route, tokens+fonts import globally with crossorigin preloads, the announcer + OS listener are wired, and the home page is token-styled with a single <main>.</done>
</task>

<task type="auto">
  <name>Task 3: Integration gate — run the full suite green (both axe modes + all specs)</name>
  <files>package.json (scripts only, no edit), tests/*.spec.ts (run, not edited)</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-VALIDATION.md (Sampling Rate → phase gate)
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 8 specs, Validation Architecture)
    - tests/a11y.spec.ts, tests/mode-toggle.spec.ts, tests/os-signal.spec.ts, tests/no-flash.spec.ts
  </read_first>
  <action>
Run the full phase gate and drive every spec from RED (Plan 01) to GREEN. Run, in order:

```bash
pnpm check                       # svelte-check + types, zero errors
pnpm lint                        # eslint-plugin-svelte a11y + prettier
pnpm test:tokens                 # raw-hex gate (node scripts/check-no-raw-hex.mjs)
pnpm test:e2e                    # full Playwright: a11y (both modes) + toggle + os-signal + no-flash
```

Fix any failure at its ROOT (per the operating contract — no band-aids). Likely touch-ups
localized to THIS plan's files (ModeToggle, +layout, +page) or a token value already in
tokens.css:
- axe contrast violation → confirm the component uses the correct semantic token (never a
  literal); the UI-SPEC pairs are AAA-verified, so a violation means a wrong token binding.
- axe "multiple main landmarks" → ensure +page.svelte has no `<main>`.
- toggle spec can't find the button → aria-label must contain "visual mode".
- no-flash / no-google-fonts failing → confirm @fontsource imports (no CDN link) and the
  inline script placement from Plan 02.
- prettier --check failing → run `pnpm exec prettier --write .` then re-verify.

Do NOT weaken a test to make it pass. Both axe scans MUST report zero violations.
  </action>
  <acceptance_criteria>
    - `pnpm check` exits 0
    - `pnpm lint` exits 0
    - `pnpm test:tokens` exits 0
    - `pnpm exec playwright test tests/a11y.spec.ts` — both "accessible" and "premium" axe tests pass (0 violations)
    - `pnpm exec playwright test tests/mode-toggle.spec.ts` — flip/persist + announce pass (MODE-01, MODE-02, MODE-05)
    - `pnpm exec playwright test tests/os-signal.spec.ts` — all 4 OS-signal cases pass (MODE-04)
    - `pnpm exec playwright test tests/no-flash.spec.ts` — pre-paint + no-google-fonts pass (MODE-03)
    - `pnpm test:e2e` exits 0 (whole suite green)
  </acceptance_criteria>
  <verify>
    <automated>pnpm test:e2e</automated>
  </verify>
  <done>pnpm check, lint, test:tokens all green; the full Playwright suite passes including zero axe violations in BOTH modes — every Phase 2 requirement is proven by command.</done>
</task>

</tasks>

<verification>
- `pnpm check && pnpm lint && pnpm test:tokens && pnpm test:e2e` all exit 0 (the phase gate).
- axe: zero violations in accessible AND premium mode (tests/a11y.spec.ts).
- Toggle is a native ≥44px aria-pressed button present in the header on every route.
- No fonts.googleapis.com / fonts.gstatic.com request fires (tests/no-flash.spec.ts).
</verification>

<success_criteria>
- MODE-01: keyboard-operable native `<button aria-pressed>` toggle in the header everywhere.
- MODE-05: switching announces via the polite live region and preserves scroll/focus (attribute flip).
- MODE-04 (live half): OS reduced-motion/contrast change auto-flips only absent an explicit choice.
- DS-02: one token-driven DOM; components carry zero raw hex; both modes axe-clean.
- The Phase 2 engine is fully proven — all Plan 01 specs green, ready for /gsd:verify-work.
</success_criteria>

<output>
After completion, create `.planning/phases/02-mode-system-design-tokens/02-03-SUMMARY.md`.
</output>

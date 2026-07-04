---
phase: 02-mode-system-design-tokens
plan: 02
type: execute
wave: 2
depends_on: ["01"]
files_modified:
  - src/lib/styles/tokens.css
  - src/app.html
  - src/lib/stores/mode.svelte.ts
autonomous: true
requirements: [DS-01, DS-02, MODE-02, MODE-03, MODE-04]
must_haves:
  truths:
    - "The page renders themed with data-mode=accessible even with JS disabled (static fallback attribute)"
    - "On first visit with no stored choice + reduced-motion/contrast OS signal, data-mode resolves to accessible before paint"
    - "On first visit with no stored choice + no OS signal, data-mode resolves to premium before paint"
    - "The rune store reads its initial mode FROM the html data-mode attribute (no hydration re-flip)"
  artifacts:
    - path: "src/lib/styles/tokens.css"
      provides: "UI-SPEC §4 verbatim token contract for both modes + companion base + .visually-hidden + .skip-link"
      contains: '[data-mode="premium"]'
      min_lines: 60
    - path: "src/app.html"
      provides: "Static data-mode=accessible fallback + verbatim inline no-flash script above %sveltekit.head%"
      contains: "did-mode"
    - path: "src/lib/stores/mode.svelte.ts"
      provides: "Svelte 5 rune store: current + announcement $state, set(), toggle()"
      exports: ["mode", "Mode"]
  key_links:
    - from: "src/app.html"
      to: "src/lib/styles/tokens.css"
      via: "inline script sets html[data-mode] which the [data-mode=...] selectors match"
      pattern: "data-mode"
    - from: "src/lib/stores/mode.svelte.ts"
      to: "document.documentElement.dataset.mode"
      via: "initial() reads the attribute; set() writes it + localStorage"
      pattern: "dataset.mode"
---

<objective>
Build the mode engine core: the WCAG-verified token contract, the pre-paint no-flash script
with a JS-disabled fallback, and the Svelte 5 rune store that owns mode writes. This is the
theming + persisted-state spine every later component reads from.

Purpose: satisfy DS-01 (AAA token contract), DS-02 (one DOM, CSS-driven modes), MODE-02
(persist via localStorage + data-mode), MODE-03 (no flash), MODE-04 (OS auto-select) at the
engine level. The visible toggle + layout wiring that exercises this is Plan 03.
Output: src/lib/styles/tokens.css, modified src/app.html, src/lib/stores/mode.svelte.ts.
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
@CLAUDE.md

<constraints>
- tokens.css is the ONLY file allowed to contain raw hex (enforced by scripts/check-no-raw-hex.mjs from Plan 01).
- The token block in UI-SPEC §4 is LOCKED and WCAG-verified — paste verbatim, do NOT substitute any color.
- The inline head script in UI-SPEC §6 / RESEARCH Example 2 is LOCKED — paste verbatim, keep it ABOVE %sveltekit.head%.
- Svelte 5 runes ONLY. Never `export let x = $state()` (throws state_invalid_export). Never destructure the store.
- Guard all localStorage/matchMedia/document access with `browser` from $app/environment (prerender-safe).
</constraints>

<interfaces>
<!-- Store contract consumed by Plan 03 (ModeToggle + layout). Executor: implement exactly. -->
export type Mode = 'accessible' | 'premium';
export const mode: {
  current: Mode;        // read via mode.current — never destructure
  announcement: string; // drives aria-live region
  set(next: Mode): void;
  toggle(): void;
};
<!-- localStorage key = "did-mode"; html[data-mode] is the single source of truth. -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create tokens.css — UI-SPEC §4 verbatim + companion base</name>
  <files>src/lib/styles/tokens.css</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§4 canonical CSS variable block — the LOCKED contract)
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 3 companion base to append)
  </read_first>
  <action>
Create `src/lib/styles/tokens.css`. FIRST paste the UI-SPEC §4 block verbatim (the `:root`
shared tokens, `[data-mode="accessible"]`, `[data-mode="premium"]`, `*:focus-visible`, and the
`@media (prefers-reduced-motion: reduce)` rule). Do NOT alter any hex value — every pair is
WCAG-AAA-verified.

```css
:root {
  /* spacing / radius / motion — shared */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:24px; --space-6:32px; --space-7:48px; --space-8:64px;
  --radius-sm:6px; --radius-md:12px; --radius-lg:20px;
  --dur:200ms; --ease:cubic-bezier(.2,.7,.2,1);
  --focus-width:3px; --focus-offset:2px;
  --font-heading:"Lexend",system-ui,sans-serif;
  --font-body:"Source Sans 3",system-ui,-apple-system,sans-serif;
  --measure:68ch;
}

[data-mode="accessible"] {
  color-scheme: light;
  --bg:#FFFFFF; --surface:#F8FAFC; --border:#D6DEE8;
  --text:#111111; --text-muted:#404A56;
  --primary:#0A4E8B; --primary-hover:#08427A; --on-primary:#FFFFFF;
  --accent:#9A3412; --on-accent:#FFFFFF;
  --focus-ring:#08427A;
  --shadow:0 1px 2px rgba(16,24,40,.08);
  --glow:none;
  --fs-base:1.125rem; --lh-body:1.7; --lh-heading:1.2;
  --fs-h1:2.75rem; --fs-h2:2rem; --fs-h3:1.5rem; --fs-lg:1.375rem; --fs-sm:1rem;
}

[data-mode="premium"] {
  color-scheme: dark;
  --bg:#0A0E14; --surface:rgba(20,27,38,.72); --border:rgba(120,140,170,.22);
  --text:#E6EDF5; --text-secondary:#C3CEDC; --text-muted:#9AA7B8;
  --primary:#6FB4FF; --primary-solid:#4DA3FF; --on-primary:#0A0E14;
  --accent:#FF9E5E; --on-accent:#0A0E14;
  --focus-ring:#6FB4FF;
  --shadow:0 8px 32px rgba(0,0,0,.45);
  --glow:0 0 24px rgba(111,180,255,.35);
  --fs-base:1rem; --lh-body:1.6; --lh-heading:1.15;
  --fs-h1:clamp(2.5rem,6vw,4rem); --fs-h2:2.25rem; --fs-h3:1.5rem; --fs-lg:1.25rem; --fs-sm:.875rem;
}

*:focus-visible {
  outline:var(--focus-width) solid var(--focus-ring);
  outline-offset:var(--focus-offset);
  border-radius:2px;
}

@media (prefers-reduced-motion: reduce){
  :root{ --dur:0ms; }
  *,*::before,*::after{ animation-duration:0ms!important; animation-iteration-count:1!important; transition-duration:0ms!important; scroll-behavior:auto!important; }
}
```

THEN append the RESEARCH Example 3 companion base (body/heading defaults, `.visually-hidden`
clip-rect utility, `.skip-link`):

```css
/* --- companion base (append below the UI-SPEC verbatim block) --- */
html { color-scheme: light; }
body {
	margin: 0;
	background: var(--bg);
	color: var(--text);
	font-family: var(--font-body);
	font-size: var(--fs-base);
	line-height: var(--lh-body);
	-webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-heading); line-height: var(--lh-heading); }

/* clip-rect visually-hidden — stays in the a11y tree (NOT display:none) */
.visually-hidden {
	position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
	overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}
/* skip link (fuller version is Phase 3; token-correct focus here) */
.skip-link {
	position: absolute; left: var(--space-3); top: -100%;
	background: var(--surface); color: var(--text);
	padding: var(--space-2) var(--space-4); border-radius: var(--radius-sm); z-index: 100;
}
.skip-link:focus { top: var(--space-3); }
```

Do NOT import this file here — Plan 03's +layout.svelte imports it globally.
  </action>
  <acceptance_criteria>
    - `grep -q '\[data-mode="accessible"\]' src/lib/styles/tokens.css`
    - `grep -q '\[data-mode="premium"\]' src/lib/styles/tokens.css`
    - `grep -q '#111111' src/lib/styles/tokens.css` (accessible --text)
    - `grep -q '#6FB4FF' src/lib/styles/tokens.css` (premium --primary)
    - `grep -q 'prefers-reduced-motion: reduce' src/lib/styles/tokens.css`
    - `grep -q '\.visually-hidden' src/lib/styles/tokens.css && grep -q 'clip: rect(0 0 0 0)' src/lib/styles/tokens.css`
    - `grep -q '\*:focus-visible' src/lib/styles/tokens.css`
  </acceptance_criteria>
  <verify>
    <automated>node scripts/check-no-raw-hex.mjs</automated>
  </verify>
  <done>tokens.css holds the verbatim UI-SPEC §4 contract for both modes plus the companion base; raw-hex gate still passes (hex only lives here).</done>
</task>

<task type="auto">
  <name>Task 2: Modify app.html — static fallback + verbatim inline no-flash script</name>
  <files>src/app.html</files>
  <read_first>
    - src/app.html (current: no data-mode, no inline script)
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§6 inline script — LOCKED)
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 2 + Pitfall 1 static fallback, Pitfall 5 script placement)
  </read_first>
  <action>
Replace `src/app.html` with RESEARCH Example 2. Two critical requirements: (1) `<html>` carries
a STATIC `data-mode="accessible"` (no-JS/pre-script fallback — Pitfall 1); (2) the inline script
sits ABOVE `%sveltekit.head%` (Pitfall 5 — must run before the stylesheet link parses). Drop the
scaffold's stray `<meta name="text-scale">`.

```html
<!doctype html>
<html lang="en" data-mode="accessible">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<!-- No-flash: runs synchronously BEFORE %sveltekit.head% stylesheets. Survives prerender verbatim. -->
		<script>
			try {
				var k = 'did-mode', s = localStorage.getItem(k), m;
				if (s === 'accessible' || s === 'premium') { m = s; }
				else {
					var rm = matchMedia('(prefers-reduced-motion: reduce)').matches,
						hc = matchMedia('(prefers-contrast: more)').matches;
					m = (rm || hc) ? 'accessible' : 'premium';
				}
				document.documentElement.dataset.mode = m;
			} catch (e) { document.documentElement.dataset.mode = 'accessible'; }
		</script>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```
  </action>
  <acceptance_criteria>
    - `grep -q 'data-mode="accessible"' src/app.html` (static fallback on <html>)
    - `grep -q "localStorage.getItem(k)" src/app.html`
    - `grep -q "prefers-reduced-motion: reduce" src/app.html && grep -q "prefers-contrast: more" src/app.html`
    - The `<script>` block appears BEFORE `%sveltekit.head%`: `awk '/<script>/{s=NR} /%sveltekit.head%/{h=NR} END{exit !(s<h)}' src/app.html`
    - `! grep -q 'text-scale' src/app.html` (scaffold meta removed)
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>app.html applies the correct mode pre-paint from stored choice → OS signal → premium default, falls back to accessible with JS disabled or on error, and the script precedes %sveltekit.head%.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Create the Svelte 5 rune mode store</name>
  <files>src/lib/stores/mode.svelte.ts</files>
  <read_first>
    - .planning/phases/02-mode-system-design-tokens/02-RESEARCH.md (Example 1 store — copy verbatim; Pattern 1, Pitfall 2 runes traps)
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§6 state engine, §5 announce copy)
  </read_first>
  <behavior>
    - initial(): returns 'accessible' when !browser; otherwise reads document.documentElement.dataset.mode ('premium' → premium, else accessible)
    - set('premium'): updates current, sets announcement to "Premium visual mode on.", writes localStorage['did-mode']='premium', sets document.documentElement.dataset.mode='premium'
    - set(current mode again): no-op (early return, no announcement change)
    - toggle(): flips premium↔accessible via set()
    - store is exported as a `const` instance (mode), NOT a reassignable export
    - covered at runtime by tests/mode-toggle.spec.ts (MODE-02, MODE-05) once Plan 03 wires the UI
  </behavior>
  <action>
Create `src/lib/stores/mode.svelte.ts` verbatim from RESEARCH Example 1 (this is the sanctioned
Svelte 5 pattern — field-level `$state`, exported `const` instance, initialized FROM the
attribute the inline script already set, browser-guarded writes):

```ts
import { browser } from '$app/environment';

export type Mode = 'accessible' | 'premium';
const KEY = 'did-mode';

/** Initialize FROM the attribute the inline no-flash script already set.
 *  The inline script is the single owner of priority (stored → OS → default),
 *  so the store never re-derives it and cannot disagree (no hydration re-flip). */
function initial(): Mode {
	if (!browser) return 'accessible'; // prerender-safe default
	return document.documentElement.dataset.mode === 'premium' ? 'premium' : 'accessible';
}

class ModeState {
	current = $state<Mode>(initial());
	announcement = $state('');

	set(next: Mode) {
		if (next === this.current) return;
		this.current = next;
		this.announcement =
			next === 'accessible'
				? 'Accessible mode on. High contrast, reduced motion.'
				: 'Premium visual mode on.';
		if (browser) {
			try {
				localStorage.setItem(KEY, next);
			} catch {
				/* private mode */
			}
			document.documentElement.dataset.mode = next;
		}
	}

	toggle() {
		this.set(this.current === 'premium' ? 'accessible' : 'premium');
	}
}

export const mode = new ModeState();
```

Do NOT add `export let`, do NOT destructure, do NOT use `$effect` to sync state→state.
  </action>
  <acceptance_criteria>
    - `grep -q 'export const mode = new ModeState' src/lib/stores/mode.svelte.ts`
    - `grep -q "current = \$state<Mode>(initial())" src/lib/stores/mode.svelte.ts`
    - `grep -q 'announcement = \$state' src/lib/stores/mode.svelte.ts`
    - `grep -q "from '\$app/environment'" src/lib/stores/mode.svelte.ts` (browser guard imported)
    - `! grep -q 'export let' src/lib/stores/mode.svelte.ts` (no state_invalid_export trap)
    - `pnpm check` passes (svelte-check compiles the runes module with zero errors)
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>The rune store compiles under svelte-check, exports a `const` mode instance with reactive current/announcement, initializes from the attribute, and writes localStorage + data-mode on set().</done>
</task>

</tasks>

<verification>
- `node scripts/check-no-raw-hex.mjs` exits 0 (hex confined to tokens.css).
- `pnpm check` passes (app.html + store compile clean).
- app.html static fallback + inline script placement verified by grep/awk assertions above.
- Store contract matches the `<interfaces>` block for Plan 03 to consume.
</verification>

<success_criteria>
- DS-01: tokens.css carries the verbatim AAA-verified two-mode contract.
- DS-02: modes differ purely via `[data-mode]` selectors on one DOM; hex confined to tokens.css.
- MODE-02/03/04 engine: pre-paint script resolves stored → OS → premium with an accessible
  no-JS fallback; store persists + mirrors data-mode on write.
- No visible toggle/layout yet (Plan 03 wires it and turns the Plan 01 specs green).
</success_criteria>

<output>
After completion, create `.planning/phases/02-mode-system-design-tokens/02-02-SUMMARY.md`.
</output>

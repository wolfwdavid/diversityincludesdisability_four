# Phase 2: Mode System & Design Tokens — Research

**Researched:** 2026-07-04
**Domain:** Svelte 5 runes state engine + CSS custom-property theming + self-hosted fonts + Playwright/axe a11y validation, on a prerendered SvelteKit static site under a GitHub Pages base path
**Confidence:** HIGH (all mechanics verified against current source files, live npm registry, @fontsource tarball inspection, and Playwright feature docs on 2026-07-04)

## User Constraints

No `02-CONTEXT.md` exists for this phase — there was no `/gsd:discuss-phase` pass. The binding contract is therefore **`02-UI-SPEC.md`**, which is authoritative and must not be contradicted:

- **Locked (from UI-SPEC):** the canonical `tokens.css` variable block (Section 4, implement verbatim), the WCAG-verified color pairs (Section 3, do not substitute), the toggle semantics (`<button aria-pressed>`, ≥44px, label+icon, `aria-live` announce — Section 5), the state engine design (`data-mode` on `<html>`, `did-mode` localStorage key, inline no-flash script verbatim, OS auto-select logic — Section 6), and self-hosted fonts with no Google CDN call (Section 2).
- **Claude's discretion (implementation mechanics this research resolves):** the exact Svelte 5 rune store shape; @fontsource-vs-manual-woff2 decision; test file structure; eslint config; how the announcer element is wired.
- **Deferred / out of scope for Phase 2:** skip-links + full nav + landmarks polish (A11Y-01/02 → Phase 3), all page content (CONT-* → Phase 3), the Threlte 3D hero and its poster/code-split (PREM-* → Phase 3/4). Phase 2 ships the *engine + tokens + toggle*, proven on the existing hello-world page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support (how this phase implements it) |
|----|-------------|-------------------------------------------------|
| MODE-01 | Toggle Premium⇄Accessible via native keyboard-operable `<button aria-pressed>` in the header on every page | `ModeToggle.svelte` (native button, `aria-pressed`, ≥44px) wired into `+layout.svelte` header so it renders on all routes. Code Example 5. |
| MODE-02 | Chosen mode persists across pages + return visits (localStorage) applied via `data-mode` on `<html>` | `mode.svelte.ts` writes `localStorage['did-mode']` + `document.documentElement.dataset.mode` in `set()`. Code Example 1. |
| MODE-03 | Applied before first paint, no flash (render-blocking inline head script) | Inline script placed **above** `%sveltekit.head%` in `app.html`; static `data-mode="accessible"` fallback on `<html>`. Code Example 2 + Pitfall 1. |
| MODE-04 | No stored choice → auto-select Accessible if `prefers-reduced-motion: reduce` OR `prefers-contrast: more` | Same inline script (initial paint) + a live `matchMedia` change listener in `+layout.svelte` that only auto-flips when no explicit choice is stored. Code Examples 2 + 5. |
| MODE-05 | Switching announces to AT via polite live region; preserves scroll + focus (attribute flip, not navigation) | `mode.announcement` `$state` drives a persistent `role="status" aria-live="polite"` region; `toggle()` mutates attribute only (no `goto`), so scroll/focus/DOM identity are inherently preserved. Code Examples 1 + 5. |
| DS-01 | CSS custom-property token contract for both modes, WCAG-AAA-verified pairs | `tokens.css` = UI-SPEC Section 4 verbatim; contrast proven by axe scans in both modes. Code Example 3 + Validation Architecture. |
| DS-02 | Modes differ through tokens/CSS driven by `data-mode`, one auditable accessible DOM (no duplicated markup) | One DOM themed by `[data-mode="…"]` selectors; enforced by a raw-hex grep gate + axe running the *same* DOM in both modes. Validation Architecture. |

</phase_requirements>

## Summary

Phase 2 is a **theming + persisted-state** problem, not a redesign. The design is fully specified in `02-UI-SPEC.md`; this research resolves the four MEDIUM-confidence *mechanics* the planner needs to write correct tasks: (1) the exact Svelte 5 rune module-store shape that avoids `state_invalid_export` and the destructure-loses-reactivity trap, initializing **from the `data-mode` attribute** the inline script already set; (2) placement of the inline no-flash script **above** `%sveltekit.head%` in `app.html` (it survives prerender verbatim and runs before the stylesheet link is parsed); (3) prerender-safe wiring of the toggle + `matchMedia` guarded by `browser` from `$app/environment`; (4) **@fontsource** (self-hosted, Vite-rewritten, base-correct) with preload of the two critical weights and zero `fonts.googleapis.com` requests.

The current repo is a bare Phase-1 scaffold: `app.html` has **no** `data-mode` and **no** inline script; `+layout.svelte` renders only `{@render children()}` (no header/toggle/announcer); and the a11y/test/font toolchain (`@fontsource/*`, `@playwright/test`, `@axe-core/playwright`, `eslint-plugin-svelte`, `@lhci/cli`) is **not yet installed** — `package.json` holds only the minimal SvelteKit + `svelte-check` scaffold. So Phase 2 must both install that toolchain and author the engine.

**Primary recommendation:** Implement the store as a single exported `const` class instance with **field-level `$state`** (never `export let x = $state()`), initialize `current` by reading `document.documentElement.dataset.mode`, and let a reactive `announcement` `$state` field drive the live region. Add a static `data-mode="accessible"` on `<html>` in `app.html` (no-JS fallback) with the verbatim inline script above `%sveltekit.head%`. Use **@fontsource** latin-subset CSS imported in `+layout.svelte`, preloading the two critical woff2 files via Vite-resolved URLs. Validate every requirement with Playwright + `@axe-core/playwright` (both modes zero-violations, toggle flip/persist, OS-signal auto-select via `emulateMedia`, no-flash via `waitUntil:'commit'`, no-google-fonts network assertion) plus a raw-hex grep gate.

## Standard Stack

### Core (already installed — do not change)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.56.x | Runes reactivity for the mode store | `$state`/`$derived` give fine-grained, module-shareable state |
| @sveltejs/kit | 2.63+ | Router, `$app/paths`, `$app/environment` | `browser` guard + `base` are the prerender-safety primitives |
| @sveltejs/adapter-static | 3.0.10 | Prerender to static HTML | `app.html` inline script is copied verbatim into every page |
| vite | 8.x | Bundler; rewrites font `url()` to base-correct hashed assets | Makes @fontsource "just work" under the base path |

### Supporting — ADD in Phase 2
| Library | Version (verified 2026-07-04) | Purpose | Notes |
|---------|-------------------------------|---------|-------|
| @fontsource/lexend | 5.2.11 | Self-hosted Lexend (headings) | `font-display: swap` is the file default (confirmed in tarball). Import latin-subset CSS. |
| @fontsource/source-sans-3 | 5.2.9 | Self-hosted Source Sans 3 (body/UI) | Same convention; `files/source-sans-3-latin-<w>-normal.woff2`. |
| @playwright/test | 1.61.1 | E2E + a11y driver | `emulateMedia({reducedMotion, contrast})` for OS-signal tests. |
| @axe-core/playwright | 4.12.1 | axe engine bound to Playwright | `new AxeBuilder({page}).analyze()` → assert `violations == []`. |
| axe-core | 4.12.1 | Rules engine (keep on same 4.12.x) | Transitive but pin to match. |
| eslint | 10.6.0 | Flat-config linter | First static gate. |
| eslint-plugin-svelte | 3.20.0 | Svelte + a11y lint rules (`svelte/a11y-*`) | Pairs with `svelte-eslint-parser@1.8.0`. |
| typescript-eslint | 8.62.1 | TS flat-config helper | |
| eslint-config-prettier | 10.1.8 | Disable conflicting rules | |
| prettier + prettier-plugin-svelte | 3.9.4 / 4.1.1 | Formatting | |
| @lhci/cli | 0.15.1 | Lighthouse a11y/perf budget (optional this phase) | Assert `categories.accessibility >= 1.0`. |

**Installation (Phase 2 additions):**
```bash
pnpm add @fontsource/lexend@5.2.11 @fontsource/source-sans-3@5.2.9
pnpm add -D @playwright/test@1.61.1 @axe-core/playwright@4.12.1 axe-core@4.12.1 \
  eslint@10.6.0 eslint-plugin-svelte@3.20.0 svelte-eslint-parser@1.8.0 \
  typescript-eslint@8.62.1 eslint-config-prettier@10.1.8 \
  prettier@3.9.4 prettier-plugin-svelte@4.1.1 @lhci/cli@0.15.1 globals
pnpm exec playwright install --with-deps chromium
```

### Font decision: @fontsource — NOT manual woff2 (justified)
**Use `@fontsource/lexend` + `@fontsource/source-sans-3`.** Rationale:

| Criterion | @fontsource (chosen) | Manual woff2 in `static/fonts/` |
|-----------|----------------------|---------------------------------|
| Base-path correctness | Vite rewrites `url()` → `_app/immutable/assets/…` with the base prefix automatically | You must hand-write `{base}/fonts/…` in CSS and `%sveltekit.assets%/fonts/…` in `app.html` — easy to get wrong, the #1 gh-pages bug |
| `font-display: swap` | Default in shipped CSS (verified in tarball) | You author `@font-face` yourself |
| Subsetting | Latin-only CSS entrypoints (`latin-400.css`) ship a lean payload | You subset manually (fonttools/glyphhanger) |
| Cache-busting | Content-hashed immutable assets for free | Unhashed; weaker caching |
| Google CDN request | None — fully self-hosted by design | None (if done right) |
| Maintenance | Versioned, updatable via pnpm | Manual re-download on updates |

The only thing @fontsource does *not* give for free is a stable filename to preload. Solve that by **importing the two critical woff2 files as assets** (`import url from '@fontsource/lexend/files/lexend-latin-700-normal.woff2'`) — Vite returns the hashed, base-correct URL, which you feed to a `<link rel="preload">` in `<svelte:head>`. This is the clean, base-safe preload path. (Manual woff2's only advantage — stable names for `app.html` preload — is not worth surrendering automatic base rewriting on a base-path site.)

**Verified file/CSS naming (from tarball inspection 2026-07-04):**
- CSS (latin only, lean): `@fontsource/lexend/latin-300.css` `latin-400.css` `latin-600.css` `latin-700.css`; `@fontsource/source-sans-3/latin-400.css` `latin-500.css` `latin-600.css` `latin-700.css`
- Preload files: `@fontsource/lexend/files/lexend-latin-700-normal.woff2`, `@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2`

## Architecture Patterns

### File list to create / modify (Phase 2)
| Path | Action | Purpose |
|------|--------|---------|
| `src/app.html` | **modify** | Add static `data-mode="accessible"` on `<html>` + verbatim inline no-flash script above `%sveltekit.head%` |
| `src/lib/stores/mode.svelte.ts` | **create** | Rune store: `current` + `announcement` `$state`, `set()`, `toggle()` |
| `src/lib/styles/tokens.css` | **create** | UI-SPEC Section 4 verbatim + base body styles + `.visually-hidden` + `.skip-link` |
| `src/lib/components/shell/ModeToggle.svelte` | **create** | Native `<button aria-pressed>` calling `mode.toggle()` |
| `src/routes/+layout.svelte` | **modify** | Import tokens+fonts, preload links, header + `<ModeToggle>` + persistent announcer, live `matchMedia` listener |
| `eslint.config.js` | **create** | Flat config with `eslint-plugin-svelte` a11y rules |
| `playwright.config.ts` | **create** | `webServer: pnpm dev`, chromium project, baseURL |
| `tests/a11y.spec.ts` | **create** | axe zero-violations in both modes |
| `tests/mode-toggle.spec.ts` | **create** | flip + `aria-pressed` + persist + announce |
| `tests/os-signal.spec.ts` | **create** | reduced-motion / contrast auto-select + explicit override |
| `tests/no-flash.spec.ts` | **create** | pre-paint `data-mode` + no-google-fonts network assert |
| `scripts/check-no-raw-hex.mjs` (or inline `rg`) | **create** | grep gate: components use tokens, not raw hex |
| `package.json` | **modify** | Add deps + `lint` / `test:e2e` / `test:a11y` scripts |

### Pattern 1: Svelte 5 rune module store (the critical mechanic)
**What:** A `.svelte.ts` module exporting **one `const` class instance** with **field-level `$state`**. This is the sanctioned Svelte 5 pattern; it sidesteps every runes trap:
- ✅ Exporting a `const` object/instance is legal. ❌ `export let x = $state()` throws `state_invalid_export` (reassignable ESM export).
- ✅ Read `mode.current` through the proxy in templates → reactive. ❌ `const { current } = mode` snapshots and loses reactivity — never destructure.
- ✅ `$derived` for computed (`isPremium`). ❌ Don't use `$effect` to sync state→state.

**When:** The single app-wide mode store. Initialize `current` **from the attribute** the inline script already set — the inline script is the *one* place that encodes priority (stored → OS → default), so the store never re-derives it and can't disagree (no hydration re-flip).

### Pattern 2: Inline no-flash script above `%sveltekit.head%`
**What:** A synchronous IIFE in `app.html`'s `<head>`, placed **before** `%sveltekit.head%`, sets `document.documentElement.dataset.mode` before the SvelteKit-injected stylesheet `<link>` is parsed — so the first style resolution already uses the correct mode. adapter-static copies `app.html` verbatim into every prerendered page (only `%sveltekit.*%` placeholders are substituted), so the script ships to every route and is **not** stripped by prerender. Wrap in `try/catch` defaulting to `accessible`.
**Critical addition (this research):** put a **static `data-mode="accessible"`** on the `<html>` element too. With JS disabled the inline script never runs; without a static attribute the `[data-mode="…"]` token selectors would not match and the page would render **unthemed**. Static `accessible` guarantees the no-JS render is the gold-standard mode. The inline script overrides it on capable browsers.

### Pattern 3: Prerender-safe browser guards
**What:** Everything touching `localStorage`, `matchMedia`, or `document` must be guarded by `browser` from `$app/environment` (false during the Node prerender pass). The store's `initial()` returns `'accessible'` when `!browser`; the layout's `matchMedia` listener lives in a `$effect` (client-only) and returns early when `!browser`. This lets the page prerender without `ReferenceError: document is not defined`.

### Pattern 4: Reactive announcer (MODE-05)
**What:** Rather than `querySelector('#mode-announcer').textContent = …` (SSR-fragile, timing-sensitive), keep an `announcement` `$state` field on the store and bind it into a **persistent** `role="status" aria-live="polite"` region rendered once in the layout. The region exists (empty) at mount, so AT reliably announces later text mutations. The toggle alternates messages, so consecutive announcements always differ (no "same-text won't re-announce" issue).

### Anti-Patterns to Avoid
- **`export let mode = $state(...)` from a module** → `state_invalid_export`. Export a `const` instance.
- **Destructuring the store** (`const { current } = mode`) → dead reactivity.
- **Reading mode in `onMount`/store subscription for initial paint** → visible flash. The inline head script owns first paint.
- **Switching mode via `goto('?mode=…')` or `{#key mode}`** → re-mounts tree, loses scroll + focus. Flip the attribute in place.
- **Hardcoding font/asset paths** (`/fonts/x.woff2`, `fonts.googleapis.com`) → 404 under base path / privacy+perf regression. Use @fontsource + Vite-resolved URLs.
- **`outline: none`** anywhere → the UI-SPEC global `:focus-visible` ring is mandatory in both modes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Self-hosting fonts under a base path | Hand-authored `@font-face` + manual `{base}` URLs + manual subsetting | @fontsource latin-subset CSS + Vite `url()` rewriting | Vite handles base prefix + hashing; @fontsource ships correct `swap` + subsets |
| Theme flash prevention | `onMount` theme application, CSS-only `@media` mode | Inline render-blocking head script setting `data-mode` | Only pre-paint attribute set avoids flash on a prerendered site |
| Contrast verification | Eyeballing hex pairs | axe-core WCAG scan in both modes | Automated, objective, catches AAA/AA regressions |
| Toggle keyboard/focus/role | Styled `<div on:click>` | Native `<button aria-pressed>` | Free keyboard, focus, role, Enter/Space |
| OS-signal media testing | Reading your own machine's settings | Playwright `emulateMedia({reducedMotion, contrast})` | Deterministic in CI |
| Reactive shared state | Svelte 4 writable stores + manual subscribe | Svelte 5 rune `const` class instance | Fine-grained, no boilerplate, module-shareable |

**Key insight:** Every one of these has a sharp, well-documented edge (base-path 404, FOUC-of-mode, `state_invalid_export`, aria-live timing) that the ecosystem has already solved. Custom solutions here reproduce known bugs.

## Common Pitfalls

### Pitfall 1: No-JS / pre-script unthemed render
**What goes wrong:** Tokens live under `[data-mode="…"]`. If `data-mode` is absent (JS disabled, or a split-second before the inline script), *no* token selector matches → unstyled page. For a disability-equity org, a broken no-JS render is a mission failure.
**Avoid:** Static `data-mode="accessible"` on `<html>` in `app.html`. The inline script upgrades it; no-JS keeps the guaranteed-usable mode.
**Warning sign:** Disable JS → page renders with default UA styles / wrong colors.

### Pitfall 2: `state_invalid_export` / dead reactivity in the store
**What goes wrong:** Build error, or the toggle "does nothing" because state was destructured/exported wrong.
**Avoid:** `const` instance, field-level `$state`, read via `mode.current`, never destructure. (Code Example 1.)
**Warning sign:** `state_invalid_export` at build; UI not reacting to clicks.

### Pitfall 3: Font preload without `crossorigin` → double download
**What goes wrong:** Fonts are always fetched in CORS mode; a `<link rel=preload as=font>` **without** `crossorigin` doesn't match the actual request, so the browser downloads the font twice and the preload is wasted.
**Avoid:** `<link rel="preload" as="font" type="font/woff2" crossorigin="anonymous" …>` — even same-origin.
**Warning sign:** Network tab shows the woff2 fetched twice; Lighthouse "preloaded but not used".

### Pitfall 4: `emulateMedia` set after navigation
**What goes wrong:** The inline script reads `matchMedia` at load; if the test emulates media *after* `goto`, the initial `data-mode` is already computed from defaults → assertion fails.
**Avoid:** Call `page.emulateMedia(...)` (and `addInitScript` for localStorage) **before** `page.goto('/')`.
**Warning sign:** OS-signal test flaky / always reads `premium`.

### Pitfall 5: Inline script placed *after* `%sveltekit.head%`
**What goes wrong:** The stylesheet link parses before `data-mode` is set → first style calc uses the fallback mode → a one-frame flash.
**Avoid:** Script goes **above** `%sveltekit.head%`.
**Warning sign:** Brief flicker on reload with a stored non-default mode.

## Code Examples

### Example 1 — `src/lib/stores/mode.svelte.ts` (copy-pasteable)
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
  // Field-level $state → reactive through the proxy. Exported as a const instance below
  // (NEVER `export let x = $state()` — that throws state_invalid_export).
  current = $state<Mode>(initial());
  announcement = $state(''); // drives the aria-live region reactively (MODE-05)

  set(next: Mode) {
    if (next === this.current) return;
    this.current = next;
    this.announcement =
      next === 'accessible'
        ? 'Accessible mode on. High contrast, reduced motion.'
        : 'Premium visual mode on.';
    if (browser) {
      try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
      document.documentElement.dataset.mode = next; // keep CSS in sync (MODE-02)
    }
  }

  toggle() {
    this.set(this.current === 'premium' ? 'accessible' : 'premium');
  }
}

export const mode = new ModeState();
```
Consume as `mode.current` (never destructure). For computed values use `$derived(mode.current === 'premium')`.

### Example 2 — `src/app.html` (modify)
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
Note: static `data-mode="accessible"` = no-JS fallback (Pitfall 1). The odd `<meta name="text-scale">` from the scaffold can be dropped.

### Example 3 — `src/lib/styles/tokens.css`
Paste the **UI-SPEC Section 4 block verbatim** (the `:root` / `[data-mode="accessible"]` / `[data-mode="premium"]` / `:focus-visible` / reduced-motion rules), then append this companion base:
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
`tokens.css` is the **only** file allowed to contain raw hex (enforced by the grep gate).

### Example 4 — `src/lib/components/shell/ModeToggle.svelte`
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
		<!-- Lucide-geometry icon; stroke="currentColor" (no raw hex). Swap glyph on mode. -->
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

### Example 5 — `src/routes/+layout.svelte` (modify)
```svelte
<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { mode } from '$lib/stores/mode.svelte';
	import ModeToggle from '$lib/components/shell/ModeToggle.svelte';
	import favicon from '$lib/assets/favicon.svg';

	// Global tokens + self-hosted fonts (Vite rewrites url() → base-correct hashed assets; no googleapis).
	import '$lib/styles/tokens.css';
	import '@fontsource/lexend/latin-300.css';
	import '@fontsource/lexend/latin-400.css';
	import '@fontsource/lexend/latin-600.css';
	import '@fontsource/lexend/latin-700.css';
	import '@fontsource/source-sans-3/latin-400.css';
	import '@fontsource/source-sans-3/latin-500.css';
	import '@fontsource/source-sans-3/latin-600.css';
	import '@fontsource/source-sans-3/latin-700.css';

	// Resolve hashed, base-correct URLs for the two critical-weight preloads.
	import lexend700 from '@fontsource/lexend/files/lexend-latin-700-normal.woff2';
	import bodySans400 from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2';

	let { children } = $props();

	// MODE-04 live OS change — only auto-flip when the user has made NO explicit choice.
	$effect(() => {
		if (!browser) return;
		const rm = matchMedia('(prefers-reduced-motion: reduce)');
		const hc = matchMedia('(prefers-contrast: more)');
		const onChange = () => {
			if (localStorage.getItem('did-mode')) return; // respect explicit choice
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

<!-- MODE-05: persistent polite region (present at mount so AT announces later changes) -->
<p class="visually-hidden" role="status" aria-live="polite">{mode.announcement}</p>
```
(Full nav + landmarks are Phase 3; the header scaffold + toggle + announcer are Phase 2.)

### Example 6 — `playwright.config.ts`
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	fullyParallel: true,
	webServer: {
		command: 'pnpm dev --port 5173 --strictPort',
		url: 'http://localhost:5173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```
Dev server → `base = ''`, so test URLs are plain `/`. (A separate CI job may run against `pnpm build && pnpm preview` with `BASE_PATH` set for base-path fidelity — optional in Phase 2.)

### Example 7 — `eslint.config.js` (flat config with Svelte a11y)
```js
import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import svelteConfig from './svelte.config.js';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended, // turns on svelte/a11y-* rules
	prettier,
	...svelte.configs.prettier,
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: { projectService: true, extraFileExtensions: ['.svelte'], parser: ts.parser, svelteConfig }
		}
	},
	{ ignores: ['build/', '.svelte-kit/', 'node_modules/'] }
);
```
`svelte-check` (the Svelte compiler's own a11y warnings, e.g. `a11y_no_static_element_interactions`) is the **first** static a11y gate; `eslint-plugin-svelte` adds lint-time `svelte/a11y-*` rules on top.

### Example 8 — test skeletons
`tests/a11y.spec.ts`
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const m of ['accessible', 'premium'] as const) {
	test(`axe: zero violations in ${m} mode`, async ({ page }) => {
		await page.addInitScript((mode) => localStorage.setItem('did-mode', mode), m);
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-mode', m);
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
			.analyze();
		expect(violations).toEqual([]);
	});
}
```
`tests/mode-toggle.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('toggle flips data-mode + aria-pressed and persists across reload', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'accessible'));
	await page.goto('/');
	const html = page.locator('html');
	const toggle = page.getByRole('button', { name: /visual mode/i });

	await expect(html).toHaveAttribute('data-mode', 'accessible');
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	await toggle.click();
	await expect(html).toHaveAttribute('data-mode', 'premium');
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');

	await page.reload();
	await expect(html).toHaveAttribute('data-mode', 'premium'); // persisted
	expect(await page.evaluate(() => localStorage.getItem('did-mode'))).toBe('premium');
});

test('switch announces via polite live region (MODE-05)', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /visual mode/i }).click();
	await expect(page.locator('[role="status"][aria-live="polite"]')).toHaveText(/premium/i);
});
```
`tests/os-signal.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('reduced-motion auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' }); // BEFORE goto
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('prefers-contrast: more auto-selects Accessible (no stored choice)', async ({ page }) => {
	await page.emulateMedia({ contrast: 'more' }); // Playwright ≥1.51
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'accessible');
});

test('no OS signal defaults to Premium', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'no-preference', contrast: 'no-preference' });
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});

test('explicit stored choice overrides OS signal (MODE-04 agency)', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('data-mode', 'premium');
});
```
`tests/no-flash.spec.ts`
```ts
import { test, expect } from '@playwright/test';

test('mode applied before hydration (no flash) — MODE-03', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('did-mode', 'premium'));
	await page.goto('/', { waitUntil: 'commit' }); // before paint/hydration
	// The inline synchronous head script has already run at commit → proves pre-paint application.
	expect(await page.evaluate(() => document.documentElement.dataset.mode)).toBe('premium');
});

test('no Google Fonts request fires (self-hosted)', async ({ page }) => {
	const hits: string[] = [];
	page.on('request', (r) => {
		const u = r.url();
		if (u.includes('fonts.googleapis.com') || u.includes('fonts.gstatic.com')) hits.push(u);
	});
	await page.goto('/', { waitUntil: 'networkidle' });
	expect(hits).toEqual([]);
});
```

### Example 9 — raw-hex grep gate + `package.json` scripts
Grep gate (fails if any `.svelte`/`.css` outside `tokens.css` contains a raw hex color):
```bash
# scripts/check-no-raw-hex — returns nonzero if a raw hex color leaks into components
rg -n --pcre2 '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b' \
  src --glob 'src/**/*.svelte' --glob 'src/**/*.css' --glob '!src/lib/styles/tokens.css' \
  && { echo 'FAIL: raw hex outside tokens.css'; exit 1; } || echo 'OK: components use tokens'
```
(Icons must use `stroke="currentColor"` / `fill="currentColor"`, never hex.)

`package.json` scripts to add:
```jsonc
{
  "scripts": {
    "lint": "eslint . && prettier --check .",
    "test:a11y": "playwright test tests/a11y.spec.ts",
    "test:e2e": "playwright test",
    "test:tokens": "bash scripts/check-no-raw-hex.sh",
    "test": "pnpm check && pnpm lint && pnpm test:tokens && pnpm test:e2e"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte 4 `writable()` store + `$store` | Svelte 5 rune `const` class instance with `$state` fields | Svelte 5 (2024) | Fine-grained reactivity, module-shareable, no `export let $state` |
| Google Fonts `<link>` CDN | `@fontsource` self-hosted, Vite-bundled | Standard since ~2022 | Privacy + perf + base-path-correct + no third-party request |
| Theme in `onMount` / CSS `@media` only | Inline render-blocking head script sets `data-mode` pre-paint | Canonical for prerendered SvelteKit | Eliminates FOUC-of-mode |
| `prefers-contrast` untestable in CI | `page.emulateMedia({ contrast: 'more' })` | Playwright 1.51+ | MODE-04 fully automatable |

**Deprecated/outdated:** Svelte 4 store syntax for new code; manual `@font-face` for self-hosting under a base path; `enhanced-img`/Threlte are out of Phase 2 scope (Phase 3/4).

## Open Questions

1. **`svelte.configs.recommended` a11y rule coverage vs `svelte-check`**
   - Known: Svelte 5 emits a11y warnings at compile; `svelte-check` surfaces them. `eslint-plugin-svelte@3.20.0` also ships `svelte/a11y-*` rules.
   - Unclear: exact overlap (some a11y checks migrated into the compiler). Not blocking.
   - Recommendation: run **both** `pnpm check` (svelte-check) and `pnpm lint`; treat axe as the authoritative runtime gate. If a rule double-reports, silence the eslint duplicate, not the compiler.

2. **Layout-shift-free mode swap (UI-SPEC acceptance "no layout shift")**
   - Known: swap is attribute-only (no reflow from navigation). But Accessible base type is 18px vs Premium 16px, so text *box* sizes differ by design — that is intended restyling, not a "shift" bug.
   - Recommendation: assert no *unexpected* CLS by comparing the `<header>`/toggle bounding box before/after toggle (should be stable); do not assert body text is pixel-identical across modes (it isn't, by spec).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | @playwright/test 1.61.1 + @axe-core/playwright 4.12.1 |
| Config file | `playwright.config.ts` (create — Wave 0) |
| Quick run command | `pnpm exec playwright test <file> --project=chromium` |
| Full suite command | `pnpm test:e2e` (all `tests/*.spec.ts`) |
| Static gates | `pnpm check` (svelte-check a11y) · `pnpm lint` (eslint-plugin-svelte) · `pnpm test:tokens` (raw-hex grep) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODE-01 | Native `<button aria-pressed>` present, keyboard-operable, ≥44px | e2e (role query + keyboard) | `pnpm exec playwright test tests/mode-toggle.spec.ts` | ❌ Wave 0 |
| MODE-02 | Mode persists across reload via localStorage + `data-mode` | e2e | `pnpm exec playwright test tests/mode-toggle.spec.ts` | ❌ Wave 0 |
| MODE-03 | `data-mode` set pre-paint (no flash) + no google-fonts request | e2e (`waitUntil:'commit'`, network listener) | `pnpm exec playwright test tests/no-flash.spec.ts` | ❌ Wave 0 |
| MODE-04 | reduced-motion / contrast auto-selects Accessible; explicit choice overrides | e2e (`emulateMedia`) | `pnpm exec playwright test tests/os-signal.spec.ts` | ❌ Wave 0 |
| MODE-05 | Switch announces via `role=status aria-live=polite`; attribute-flip preserves scroll/focus | e2e (live-region text assert) | `pnpm exec playwright test tests/mode-toggle.spec.ts` | ❌ Wave 0 |
| DS-01 | Token contract yields WCAG-AAA/AA contrast in both modes | e2e (axe zero-violations ×2) | `pnpm exec playwright test tests/a11y.spec.ts` | ❌ Wave 0 |
| DS-02 | One DOM, CSS-driven modes, components use tokens not hex | grep gate + axe same-DOM both modes | `pnpm test:tokens` + `tests/a11y.spec.ts` | ❌ Wave 0 |

Extra automated guards (map to UI-SPEC acceptance):
- **No google-fonts** network assertion (`tests/no-flash.spec.ts`) → UI-SPEC §7 "no fonts.googleapis.com request".
- **Raw-hex grep** (`scripts/check-no-raw-hex`) → UI-SPEC §7 "components reference vars, zero raw hex".
- **Header box stable across toggle** (optional CLS check) → UI-SPEC §7 "no layout shift".

### Sampling Rate
- **Per task commit:** the single spec for the touched behavior, e.g. `pnpm exec playwright test tests/mode-toggle.spec.ts` (< 15 s), plus `pnpm check`.
- **Per wave merge:** `pnpm test:tokens && pnpm test:e2e` (full Playwright + grep gate).
- **Phase gate:** `pnpm check && pnpm lint && pnpm test:tokens && pnpm test:e2e` all green before `/gsd:verify-work`; both axe scans must show zero violations.

### Wave 0 Gaps
- [ ] Install toolchain: `@fontsource/*`, `@playwright/test`, `@axe-core/playwright`, `axe-core`, `eslint` + `eslint-plugin-svelte` + `svelte-eslint-parser` + `typescript-eslint` + `eslint-config-prettier`, `prettier` + `prettier-plugin-svelte`, `globals`, `@lhci/cli`; `pnpm exec playwright install --with-deps chromium` (see Installation).
- [ ] `playwright.config.ts` — dev-server + chromium project (Example 6).
- [ ] `eslint.config.js` — flat config w/ Svelte a11y (Example 7).
- [ ] `tests/a11y.spec.ts` — covers DS-01, DS-02.
- [ ] `tests/mode-toggle.spec.ts` — covers MODE-01, MODE-02, MODE-05.
- [ ] `tests/os-signal.spec.ts` — covers MODE-04.
- [ ] `tests/no-flash.spec.ts` — covers MODE-03 + no-google-fonts.
- [ ] `scripts/check-no-raw-hex.sh` — covers DS-02 token discipline.
- [ ] `package.json` scripts: `lint`, `test:a11y`, `test:e2e`, `test:tokens`, `test` (Example 9).

## Sources

### Primary (HIGH confidence)
- Current repo files read directly — `src/app.html`, `src/routes/+layout.svelte`, `+layout.ts`, `+page.svelte`, `package.json`, `svelte.config.js`, `vite.config.ts` (state of the scaffold).
- `02-UI-SPEC.md` (design contract) + phase research `ARCHITECTURE.md`, `PITFALLS.md`, `STACK.md`.
- npm registry `npm view <pkg> version` (2026-07-04): @fontsource/lexend 5.2.11, @fontsource/source-sans-3 5.2.9, @playwright/test 1.61.1, @axe-core/playwright 4.12.1, axe-core 4.12.1, eslint 10.6.0, eslint-plugin-svelte 3.20.0, @lhci/cli 0.15.1.
- @fontsource tarball inspection (`npm pack` + `tar -tzf`): confirmed `font-display: swap` default, latin-subset CSS entrypoints, and `files/<family>-latin-<weight>-normal.woff2` naming.
- Svelte 5 runes: `state_invalid_export`, field-level `$state`, no-destructure rule — Svelte docs / v5 migration guide (via PITFALLS.md Pitfall 11, cross-checked).

### Secondary (MEDIUM confidence)
- Playwright `emulateMedia({ reducedMotion, contrast })` — `contrast: 'more'|'no-preference'` added in Playwright 1.51 (project uses 1.61.1). Sources: [microsoft/playwright #34240](https://github.com/microsoft/playwright/issues/34240), [Playwright Page API](https://playwright.dev/docs/api/class-page). Firefox has a reduced-motion-after-load bug ([#31328](https://github.com/microsoft/playwright/issues/31328)) — we test chromium, unaffected.
- Font preload `crossorigin` requirement — web platform standard (fonts fetched in CORS mode).

## Metadata

**Confidence breakdown:**
- Standard stack / versions: HIGH — live registry + tarball inspection.
- Store pattern & no-flash mechanics: HIGH — matches Svelte 5 sanctioned pattern + verbatim UI-SPEC script; confirmed against current `app.html`.
- Font approach: HIGH — @fontsource naming + swap default verified in tarball; base rewriting is documented Vite behavior.
- Testing/emulateMedia: HIGH — `contrast` emulation confirmed available in 1.61.1.
- eslint a11y rule overlap with svelte-check: MEDIUM — see Open Question 1.

**Research date:** 2026-07-04
**Valid until:** ~2026-08-04 (fast-moving: Svelte/Playwright/@fontsource; re-verify versions if planning slips a month)

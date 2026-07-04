# Pitfalls Research

**Domain:** Dual-mode (Premium 3D + gold-standard Accessible) SvelteKit static site on GitHub Pages, under a base path, for a disability-equity organization
**Researched:** 2026-07-04
**Confidence:** HIGH (base-path, theme-flash, Svelte 5 runes, and Threlte disposal facts verified against official docs + open sveltejs/kit issues; a11y guidance is WCAG 2.2 / APG canonical)

> Reputational stakes note: this is a disability-equity org. An accessibility defect here is not a bug — it is a mission failure that undermines the org's credibility. Treat every a11y pitfall below as release-blocking, not "nice to fix later."

## Critical Pitfalls

### Pitfall 1: Base-path breakage — hardcoded `/` links, `<img src>`, and `_app/immutable` chunks 404 on GitHub Pages

**What goes wrong:**
The site works perfectly on `localhost:5173` (served from `/`) but on `https://<user>.github.io/diversityincludesdisability_four/` every internal link, image, favicon, font, and even the JS/CSS chunks under `_app/immutable/chunks/...` return 404. The page renders as unstyled HTML or a blank white screen. This is the single most common way SvelteKit-on-Pages ships broken. Multiple long-standing sveltejs/kit issues (#4528, #6767, #9341, #10358, #13954) trace back to base-path handling.

**Why it happens:**
Dev server runs at the root, so absolute paths like `href="/about"` and `src="/logo.png"` resolve fine locally and are never noticed. In production the app lives one directory deep, so `/about` points at the domain root, not `/diversityincludesdisability_four/about`. Developers also forget that `kit.paths.base` must be applied to *every* internal reference, and that Vite-imported assets vs. `static/` assets behave differently.

**How to avoid:**
- Set `kit.paths.base = process.env.BASE_PATH ?? ''` (or hardcode `/diversityincludesdisability_four`) in `svelte.config.js`, and drive it from an env var so local dev and CI can differ.
- Never hardcode a leading-slash internal path. For links use SvelteKit's automatic base handling with relative-resolved routes, or import `{ base }` from `$app/paths` and write `href="{base}/about"`.
- For images/assets, prefer Vite imports (`import logo from '$lib/assets/logo.png'`) which get rewritten correctly, OR reference `static/` files as `{base}/logo.png`. Do not mix and match blindly — Vite-imported assets and `static/` assets resolve differently under a base path.
- In `app.html`, use `%sveltekit.assets%` for favicon/manifest/font links, never a literal `/favicon.png`.
- Set `paths: { relative: true }` (SvelteKit default in recent versions) so generated asset URLs are relative — this is the most robust fix for the `_app/immutable` chunk 404s.
- Add a CI build step that builds with the production base path and greps the output for stray `href="/` / `src="/` occurrences.

**Warning signs:**
Blank/unstyled page on Pages; DevTools Network tab full of red 404s for `_app/immutable/*`; links that work locally 404 in production; images missing only in production.

**Phase to address:**
Phase 1 (Foundation/Deploy). Deploy a "hello world" to the real Pages URL under the real base path *before* building features. Base-path bugs found on day 1 cost minutes; found at launch they cost a frantic rewrite of every link.

---

### Pitfall 2: Missing `.nojekyll` and SPA `404.html` fallback — Pages silently eats `_app` and deep links

**What goes wrong:**
Two distinct failures: (a) GitHub Pages runs Jekyll by default, and Jekyll *ignores files and folders that start with an underscore* — which is exactly SvelteKit's `_app/` directory. Result: all app JS/CSS 404s even when base path is correct. (b) A visitor hitting `/diversityincludesdisability_four/about` directly (or refreshing) gets GitHub's generic 404 page because Pages has no server-side routing.

**Why it happens:**
Both are invisible in local `vite preview` and only manifest on the real host. Jekyll's underscore rule is obscure. The SPA-fallback requirement is easy to miss because prerendered routes work on first load — the break only appears on refresh/deep-link.

**How to avoid:**
- Add an empty `.nojekyll` file to `static/` (it gets copied to build output) — this is mandatory for any SvelteKit site on Pages.
- Configure `adapter-static({ fallback: '404.html' })` to generate an SPA fallback so deep links resolve. Since this site is fully prerenderable, you may instead prerender all routes and still keep `404.html` as a safety net.
- If fully prerendering, set `export const prerender = true` in the root `+layout.js` and confirm every route is reachable from a crawlable link (see Pitfall 3).

**Warning signs:**
`_app` chunks 404 despite correct paths; direct navigation to any non-home route shows GitHub's default 404; refresh on a subpage breaks.

**Phase to address:**
Phase 1 (Foundation/Deploy), same deploy smoke-test as Pitfall 1.

---

### Pitfall 3: Prerender failures — un-crawlable routes, `trailingSlash` mismatches, and dynamic access at build time

**What goes wrong:**
`vite build` fails with "The following routes were marked as prerenderable but were not prerendered" or "404 while prerendering," OR routes build but resolve to the wrong URL because of trailing-slash inconsistency (`/about` vs `/about/`), which on Pages produces redirects or 404s for relative asset resolution.

**Why it happens:**
- adapter-static discovers pages by crawling links from entry points. A route only reachable via a button `on:click`/JS navigation (not an `<a href>`) is never found and never prerendered.
- Code that touches `window`, `localStorage`, `document`, or `fetch` to a runtime-only endpoint at module top-level runs during prerender (in Node) and throws.
- Default `trailingSlash: 'never'` writes `about.html`; some link patterns expect `about/index.html`. Under a base path, a mismatch changes how relative asset URLs resolve.

**How to avoid:**
- Make every page reachable via a real `<a href>` somewhere in the crawl graph, or list them in `prerender.entries` in the config.
- Guard browser-only code with `import { browser } from '$app/environment'` and run DOM/`localStorage` access inside `onMount` or `if (browser)`.
- Pick a `trailingSlash` policy explicitly and keep it consistent; `'always'` (emitting `index.html` per route) is often the most predictable for Pages subfolder hosting.
- Set `prerender: { handleHttpError: 'fail', handleMissingId: 'fail' }` so broken internal links/anchors fail the build instead of shipping silently.

**Warning signs:**
Build warnings about un-prerendered routes; `ReferenceError: window is not defined` / `document is not defined` during build; 404s only on JS-navigated pages; inconsistent trailing slashes in the sitemap.

**Phase to address:**
Phase 1 for the config/policy; re-verify in every phase that adds a route.

---

### Pitfall 4: 3D canvas exposed to the accessibility tree and trapping keyboard focus

**What goes wrong:**
The Threlte `<canvas>` and its wrapper end up focusable and/or announced by screen readers. A screen-reader user hears meaningless "canvas" / graphics noise or gets stuck; a keyboard user tabs into the WebGL region and can't escape (focus trap). For a disability-equity org, a screen-reader-hostile hero is the worst possible first impression.

**Why it happens:**
Three.js/Threlte create a `<canvas>` and sometimes interactive helpers (OrbitControls, drag) that add tabindex or capture pointer/keyboard. Developers treat the 3D scene as pure decoration and forget it exists in the DOM and thus the a11y tree.

**How to avoid:**
- Mark the entire 3D region decorative: `aria-hidden="true"` on the canvas wrapper, and ensure no focusable descendants (`tabindex="-1"` on the canvas, no interactive controls that receive tab focus).
- All meaningful content (mission text, CTAs, nav) must live in real semantic DOM *outside* the canvas, so Accessible-tree users get 100% of the information without the 3D.
- Do not attach essential actions (links, buttons) to 3D objects only. 3D interactivity is enhancement, never the sole path.
- In Accessible mode, the canvas must not render at all (see Pitfall 8), so the question is moot there.

**Warning signs:**
Tabbing reaches the hero and stops advancing; screen reader announces "canvas" or reads nothing meaningful for the hero; axe/Lighthouse flags a focusable element with no accessible name.

**Phase to address:**
Phase that introduces the Threlte hero (Premium mode phase). Add a screen-reader + keyboard pass to that phase's acceptance criteria.

---

### Pitfall 5: Motion ignores `prefers-reduced-motion` / `prefers-contrast` — the org's own default signal broken

**What goes wrong:**
Parallax, auto-rotating 3D, scroll-driven animation, and transitions play regardless of the OS-level "reduce motion" setting. For vestibular-disorder users this causes nausea/dizziness. Worse for this project: the PROJECT.md explicitly promises that `prefers-reduced-motion` and `prefers-contrast` *auto-select Accessible mode* — if that wiring is missing, the site fails its own stated requirement.

**Why it happens:**
Animation libraries and Threlte loops run on `requestAnimationFrame` unconditionally. Developers test on machines without reduced-motion enabled. The media-query default logic is easy to implement backwards (defaulting to Premium and only downgrading on explicit user action).

**How to avoid:**
- On first load, before rendering mode-specific UI, read `window.matchMedia('(prefers-reduced-motion: reduce)')` and `('(prefers-contrast: more)')`. If either matches AND the user has no explicit stored preference, default to Accessible mode.
- Respect an explicit stored user choice over the OS signal (user agency), but let the OS signal be the *default*.
- Wrap all CSS transitions/animations in `@media (prefers-reduced-motion: no-preference) { ... }` so motion is opt-in at the CSS layer too — defense in depth even inside Premium mode.
- Listen for `matchMedia` `change` events so a mid-session OS toggle takes effect.

**Warning signs:**
Animations play with "Reduce motion" enabled in OS settings; Premium mode loads by default on a reduced-motion machine; no `matchMedia` listener in the mode store.

**Phase to address:**
Phase that builds the mode toggle + persistence (Foundation/Mode-system phase). This is a stated requirement, so it belongs in acceptance criteria, not polish.

---

### Pitfall 6: The mode toggle itself is inaccessible — custom control, no announcement, no keyboard support

**What goes wrong:**
The flagship "choose your experience" toggle is built as a styled `<div>`/`<span>` with an `on:click`. It has no role, no keyboard operability (can't Space/Enter it, can't Tab to it), no accessible name, and switching modes fires no live-region announcement — so a screen-reader user has no idea the mode changed or what the current mode is. The one control that embodies the site's thesis fails the audience the site is for.

**Why it happens:**
Designers want a bespoke pill/slider aesthetic and reach for divs. State-change announcements (ARIA live regions) are almost always forgotten because sighted developers *see* the change.

**How to avoid:**
- Build the toggle on a native element: a `<button aria-pressed>` (two-state) or a labeled group of `<input type="radio">` for Premium/Accessible. Native = free keyboard + focus + role.
- Give it a clear accessible name ("Switch to Accessible mode" / current state), not just an icon.
- On switch, announce via an `aria-live="polite"` region: "Accessible mode enabled." Move focus predictably (keep it on the toggle) and do not scroll-jump.
- Ensure visible `:focus-visible` styling on the toggle in *both* modes.
- Persist and reflect state (`aria-pressed`/`aria-checked`) accurately after reload.

**Warning signs:**
Toggle is a `div`; can't reach it by keyboard; no `aria-live` region in the DOM; screen reader is silent on switch; no focus ring on the toggle.

**Phase to address:**
Phase that builds the mode toggle (Foundation/Mode-system). Test with an actual screen reader (NVDA/VoiceOver) as an acceptance gate.

---

### Pitfall 7: "Premium dark" aesthetic with insufficient contrast, missing `:focus-visible`, and div-soup semantics

**What goes wrong:**
The dark, moody Premium palette uses low-contrast grey-on-grey text, translucent overlays over 3D, and thin type — failing WCAG 1.4.3 (4.5:1) / 1.4.11 (non-text 3:1). Focus rings are removed for "cleanliness" (`outline: none`) leaving keyboard users lost. Layout is nested `<div>`s with no `<header>/<nav>/<main>/<footer>`, no headings hierarchy, no landmarks — screen-reader navigation collapses.

**Why it happens:**
Premium/dark design trends prize aesthetics over contrast; designers eyeball color on high-quality monitors. `outline: none` is a reflexive "fix" for ugly default rings. Component frameworks encourage div nesting.

**How to avoid:**
- Enforce contrast in tokens: run every text/background pair through a contrast checker. Accessible mode targets AAA (7:1 body, 4.5:1 large); Premium mode must still hit AA (4.5:1 / 3:1) — dark is not an excuse.
- Text over 3D/imagery must sit on a solid or sufficiently opaque scrim, never directly over a busy canvas.
- Never `outline: none` without replacement. Use `:focus-visible { outline: ... }` with a 3:1-contrast ring visible in both themes.
- Use semantic landmarks (`<header> <nav> <main> <footer>`), a single `<h1>` per page, and logical heading order. Provide a "skip to main content" link (scope.org.uk pattern — the stated gold standard) as the first focusable element.

**Warning signs:**
Lighthouse/axe contrast failures; no visible focus ring when tabbing; screen-reader landmark list empty or all "generic"; multiple/zero `<h1>`; designers approving colors without a contrast number.

**Phase to address:**
Design-system phase (tokens/contrast/focus) up front; re-verified in every UI phase. Contrast and focus are token-level decisions — fixing them late means touching every component.

---

### Pitfall 8: Three.js/Threlte bundle bloat leaking into the Accessible build

**What goes wrong:**
Even in Accessible mode, the browser downloads Three.js (~150KB+ gzipped) and Threlte because the 3D component is statically imported somewhere in the shared graph. This violates the core promise ("Accessible mode ships zero WebGL") and slows the payload for exactly the low-end/assistive-tech users the mode targets.

**Why it happens:**
A single top-level `import Scene from '$lib/Scene.svelte'` (which imports three) in a layout or shared component pulls Three.js into the main chunk. Tree-shaking cannot remove a statically-imported module. Developers verify "it works" but never inspect the bundle.

**How to avoid:**
- Load the 3D scene *only* via dynamic import behind the mode check: `{#if premium}{#await import('$lib/three/Scene.svelte') then M}<M.default />{/await}{/if}`. This code-splits Three.js into a separate chunk fetched only in Premium mode.
- Keep all `three` / `@threlte/*` imports confined to files inside that lazily-imported subtree. Never import them in `+layout.svelte` or shared components.
- Add a bundle-analysis step (`vite build` + rollup-plugin-visualizer) and assert Three.js is absent from the initial/entry chunk.
- Consider a per-mode route or explicit boundary component so the split point is obvious and lint-enforceable.

**Warning signs:**
Initial JS payload > a few hundred KB; bundle visualizer shows `three` in the main/entry chunk; Accessible mode Network tab downloads a `three` chunk; Lighthouse "reduce unused JavaScript" flags three.

**Phase to address:**
Premium/3D phase, but the *architecture* (lazy boundary) must be decided in the Foundation phase so it isn't retrofitted.

---

### Pitfall 9: WebGL memory leaks on route change + no context-loss / no-WebGL fallback

**What goes wrong:**
Navigating between routes creates a new WebGL renderer/canvas each time without disposing the old — geometries, materials, textures, and GL contexts accumulate. Browsers cap active WebGL contexts (~8–16); exceeding it triggers "Too many active WebGL contexts. Oldest context will be lost," blanking earlier scenes and eventually crashing the tab. Separately, devices with WebGL disabled/unsupported (older assistive setups, locked-down machines) get a broken black rectangle with no fallback.

**Why it happens:**
Three.js does not garbage-collect GPU resources automatically — you must explicitly `.dispose()`. Component-per-route Canvas patterns spin up a fresh context each navigation. Developers assume WebGL is universally available.

**How to avoid:**
- Use a *single* persistent `<Canvas>` (Threlte pattern: one global canvas, portal content into it via snippets) rather than one per route/component. This is the community-recommended structure and eliminates the multi-context error.
- Call `renderer.dispose()` and dispose geometries/materials/textures in `onDestroy`. Stop the render loop when the scene unmounts or the tab is hidden (`visibilitychange`).
- Detect WebGL support before rendering; if unsupported, or on `webglcontextlost` event, fall back gracefully — show a static hero image (the Premium visuals as a poster) instead of a dead canvas, and/or nudge toward Accessible mode.
- Pause `requestAnimationFrame` when the canvas is offscreen or the OS requests reduced motion.

**Warning signs:**
Growing memory in DevTools Performance/Memory across navigations; "Too many active WebGL contexts" console warning; FPS degradation the longer the session; black rectangle on machines without WebGL.

**Phase to address:**
Premium/3D phase. Add a "navigate 20 times, check memory + context count" test and a WebGL-off manual test to that phase.

---

### Pitfall 10: Theme/mode flash (FOUC/FOUC-of-mode) on load with persisted preference

**What goes wrong:**
On every page load the site briefly renders in the wrong mode/theme (e.g., flashes Premium/dark, then snaps to Accessible/light) because the stored preference is read after hydration. On a prerendered static site there is no server to inject the right mode, so the prerendered HTML has a fixed default and the correction happens visibly. Jarring for everyone; for photosensitive/vestibular users a flash is an actual harm.

**Why it happens:**
Reading `localStorage` in `onMount` runs *after* first paint. Prerendered HTML is generated at build time with no knowledge of the user's stored choice, so the default always paints first.

**How to avoid:**
- Inject a tiny **blocking inline script in `app.html`'s `<head>`** (before any body render) that reads `localStorage` (and `matchMedia` for reduced-motion/contrast) and sets a `data-mode`/`data-theme` attribute or class on `<html>` synchronously, before first paint. CSS keys off that attribute. This is the canonical no-flash fix for static/prerendered SvelteKit and is confirmed by multiple SvelteKit dark-mode writeups.
- Do NOT rely on `onMount` for the initial mode decision.
- Keep the mode as a browser-local concern (localStorage + matchMedia); no cookie/server logic is needed and none is available on Pages.
- Ensure the inline script and the runtime store agree on the same attribute/keys so hydration doesn't re-flip.

**Warning signs:**
Visible flash/flicker of the wrong mode on reload; mode "pops" after ~100–300ms; hydration mismatch warnings in console; different mode on first paint vs. after JS loads.

**Phase to address:**
Foundation/Mode-system phase — the inline head script is part of the mode-persistence feature, not an afterthought.

---

### Pitfall 11: Svelte 5 runes migration reactivity traps

**What goes wrong:**
State that "should" update doesn't, or the build fails with `state_invalid_export`. Common in a mode store shared across routes. Specific traps (verified against Svelte 5 migration guide): (a) `$state(new ModeManager())` makes the *reference* reactive but not the class's internal fields; (b) destructuring a `$state` object snapshots the value and loses reactivity; (c) exporting a reassignable `let x = $state(...)` from a `.svelte.ts` module is a compile error; (d) using `$effect` to sync one value into another instead of `$derived`.

**Why it happens:**
Svelte 5 reactivity is opt-in per value with proxy boundaries; class instances, destructured bindings, and ESM `let` exports sit *outside* the proxy. The auto-migration tool does not catch the class-field case. Runes are new enough that habits from Svelte 4 stores mislead.

**How to avoid:**
- For the shared mode/theme store, use the sanctioned module pattern: export a **function returning the state**, or export a **`const` object/class instance and mutate its properties** — never export a reassignable `let $state`.
- Declare each reactive class field with `$state` at the field level, not just wrap the instance.
- Read `$state` through the proxy; pass a getter (not a destructured value) when handing state to children.
- Use `$derived` for computed values (e.g., "is premium"); reserve `$effect` for genuine side effects (DOM, localStorage writes), never for state-to-state syncing.
- Use `$state.raw` for large immutable-replace data to avoid proxy overhead (not critical at this site's scale, but relevant for any big content array).

**Warning signs:**
`state_invalid_export` compile error; UI doesn't react to mode change; class property changes don't propagate; overuse of `$effect`; values "stuck" after destructuring.

**Phase to address:**
Foundation phase (shared mode store is one of the first things built). Establish the store pattern once, correctly.

---

### Pitfall 12: SEO / social-card / meta failures on a static host

**What goes wrong:**
Shared links (LinkedIn, Facebook, Twitter/X — the org's channels) render with no title, no description, no preview image (broken/blank card). Missing `<title>`/meta description hurts search. Open Graph/Twitter card image uses a relative or base-path-stripped URL that crawlers can't resolve, so the card is imageless. No sitemap/robots. Canonical URL points at localhost or the wrong host.

**Why it happens:**
Meta tags are easy to skip on a "brochure" site. **Social crawlers do not execute JavaScript**, so meta injected only at runtime (client-side) is invisible to them — must be present in the prerendered HTML. OG images require *absolute* URLs (full `https://...github.io/...`), but the app is built with a base path, so relative helpers produce URLs crawlers can't fetch.

**How to avoid:**
- Put `<title>`, `<meta name="description">`, and Open Graph + Twitter Card tags in `<svelte:head>` on every page so they are prerendered into static HTML.
- OG/Twitter image and `og:url`/canonical must be **absolute URLs** including the full origin + base path. Compute from a configured `PUBLIC_SITE_URL` constant, not from relative paths.
- Ship a static OG image (1200×630) in `static/`, referenced absolutely.
- Generate a `sitemap.xml` and `robots.txt` (as prerendered routes or static files) with absolute URLs.
- Validate with the Facebook Sharing Debugger / Twitter Card Validator / LinkedIn Post Inspector after deploy.

**Warning signs:**
Blank/imageless preview when pasting the URL into Slack/LinkedIn/X; `og:image` is a relative path; canonical points to localhost; no sitemap; view-source shows no meta tags (only injected client-side).

**Phase to address:**
A dedicated SEO/meta/launch-polish phase, but wire the `<svelte:head>` pattern per page as pages are built so it isn't a giant retrofit.

---

### Pitfall 13: Images without alt, forms/inputs without labels, links without discernible names

**What goes wrong:**
Content images ship with empty/missing `alt`; the "Let's Connect" contact area (if it has any input) uses placeholder-as-label; icon-only social links (Facebook/X/LinkedIn/Instagram) have no accessible name so screen readers announce "link, link, link." Baseline WCAG failures (1.1.1, 3.3.2, 2.4.4, 4.1.2) that are indefensible for a disability-equity org.

**Why it happens:**
Alt text is tedious; decorative-vs-informative distinction is skipped. Icon links look self-evident to sighted devs. Placeholders masquerade as labels.

**How to avoid:**
- Every informative image needs meaningful `alt`; every decorative image needs `alt=""` (explicitly empty, not omitted).
- Icon-only links/buttons need an accessible name via visible text, `aria-label`, or visually-hidden text ("Diversity Includes Disability on LinkedIn").
- Any form control needs an associated `<label for>` (or wrapping label); placeholders are not labels.
- Contact is primarily an email link (`mailto:emanrimawi@gmail.com`) — ensure it has discernible link text, not a raw icon.

**Warning signs:**
axe/Lighthouse "image missing alt" / "link has no discernible name" / "form element has no label"; screen reader announces "unlabeled" or reads the filename.

**Phase to address:**
Every content phase; add "a11y attribute pass" to each page's acceptance criteria. Automate with axe in CI.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode absolute `/path` links, "fix base path later" | Fast local dev | Every link/asset must be rewritten before launch; high risk of missing some | Never — set base path on day 1 |
| Static import of Three.js "for simplicity" | One less async boundary | Three.js leaks into Accessible bundle; violates core promise; painful to split later | Never — lazy boundary from the start |
| `outline: none` for clean visuals, add focus styles later | Prettier mockups | Keyboard users stranded; retrofitting `:focus-visible` across all components | Never on interactive elements |
| Build Accessible mode as a stripped Premium (afterthought) | Less initial design work | Accessible mode becomes a degraded fallback, contradicting the mission; drift | Never — Accessible is first-class, design it first |
| Read mode from `localStorage` in `onMount` | Simple, no inline script | Visible mode flash on every load; harms photosensitive users | Never — use blocking head script |
| Skip `.nojekyll` / SPA fallback, "it works locally" | Faster first deploy | Prod-only breakage discovered at launch under time pressure | Never |
| One `<Canvas>` per route/component | Simple mental model | WebGL context exhaustion + memory leaks | Only single-page/one-scene sites |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Pages (host) | Assuming root-served; forgetting `.nojekyll` and base path | Deploy under real base path early; `.nojekyll` + SPA `404.html`; relative asset paths |
| GitHub Actions (deploy) | Building without `BASE_PATH` env; deploying `.svelte-kit` instead of build output | CI sets `BASE_PATH`, runs `vite build`, publishes the adapter-static output dir |
| Social crawlers (OG/Twitter/LinkedIn) | Client-side-only meta; relative `og:image` | Prerendered `<svelte:head>` meta; absolute image/canonical URLs; validate with debuggers |
| `mailto:` contact | Obfuscation that breaks the link; icon with no name | Plain accessible `mailto:` link with visible/labeled text |
| Threlte/Three.js | Importing `three` in shared graph; no dispose | Lazy-import behind mode check; single canvas; dispose in `onDestroy` |
| System preferences (`matchMedia`) | Read once at load, ignore changes; default to Premium | Read on load AND listen for `change`; default to Accessible on reduce-motion/contrast |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Three.js in the entry chunk | Slow first load even in Accessible mode | Lazy dynamic import boundary; bundle analysis in CI | Immediately for low-end/assistive users |
| WebGL context accumulation | "Too many active WebGL contexts"; tab slowdown/crash | Single persistent canvas; dispose on destroy | After ~8–16 route navigations |
| GPU resources never disposed | Memory grows every navigation | `.dispose()` geometries/materials/textures/renderer | Long sessions / repeated nav |
| Render loop runs offscreen/hidden | Battery drain, fan spin, jank | Pause rAF on `visibilitychange` / offscreen / reduced-motion | Mobile & low-end always |
| Large unoptimized hero images | Slow LCP, heavy payload | Responsive `<img srcset>`, modern formats, `static/` optimization | Mobile / slow connections |
| Deep `$state` proxy on large content arrays | Minor reactivity overhead | `$state.raw` for replace-not-mutate data | Large datasets (low risk here) |

## Security Mistakes

Domain-specific issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Committing plaintext creds/EIN/home address from the private Notion source | Doxxing of founder; legal/reputational harm; repo is on public-ish remotes | Hard exclude Notion secrets; commit only public site code + public content (per PROJECT.md); scan diffs before commit |
| Exposing personal email to scraping unprotected | Spam to `emanrimawi@gmail.com` | It is intentionally public; accept, or add light obfuscation that preserves accessibility — never break the `mailto:` for a11y |
| Leaking build-time env/secrets into static bundle | Anything in `PUBLIC_*` or inlined is world-readable | Only truly public values in client bundle; no secrets needed for a static site — keep it that way |
| Third-party 3D asset licensing | Using models/textures without rights | Use owned/CC0/properly-licensed assets; record provenance |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mode toggle hidden/hard to find | Users can't exercise the site's core promise | Persistent, prominent toggle in header; visible in both modes |
| Switching modes loses scroll position/context | Disorientation, especially for cognitive-load-sensitive users | Preserve context on switch; announce change; keep focus stable |
| Auto-forcing Premium on everyone | Alienates the exact audience; motion sickness | Default to Accessible on OS signals; let users opt into Premium |
| No indication of current mode | Users unsure which experience they're in | Clear current-state label + `aria-pressed`/`aria-checked` |
| Accessible mode visually "cheap"/afterthought-looking | Signals the org doesn't value it | Design Accessible mode as a polished, first-class experience |
| Skip link missing or broken under base path | Keyboard users tab through nav every page | scope.org.uk-style skip link as first focusable; test target resolves |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **GitHub Pages deploy:** Often missing `.nojekyll` + base path + `404.html` — verify on the *real* Pages URL, not `vite preview`, including a hard refresh on a deep route.
- [ ] **Mode toggle:** Often missing keyboard operability + `aria-live` announcement + focus ring — verify with NVDA/VoiceOver, not just mouse.
- [ ] **Accessible mode:** Often still downloads Three.js — verify with bundle visualizer that `three` is absent from the initial chunk.
- [ ] **Reduced-motion default:** Often not wired to auto-select Accessible — verify by enabling OS "Reduce motion" and reloading.
- [ ] **3D hero:** Often focus-trapping / SR-exposed — verify Tab passes through and SR ignores the canvas.
- [ ] **Theme/mode persistence:** Often flashes wrong mode — verify no flicker on reload via the blocking head script.
- [ ] **Contrast:** Often fails in dark Premium — verify every text/bg pair with a contrast tool (AA Premium / AAA Accessible).
- [ ] **Focus visibility:** Often removed with `outline:none` — verify a visible `:focus-visible` ring on every interactive element in both modes.
- [ ] **Social cards:** Often imageless/relative — verify with Facebook/Twitter/LinkedIn validators after deploy.
- [ ] **Images/links/labels:** Often missing alt / accessible names — verify with an axe scan showing zero violations.
- [ ] **WebGL fallback:** Often a dead black box with WebGL off — verify graceful poster/fallback with WebGL disabled.
- [ ] **Memory:** Often leaks across nav — verify stable memory + context count after 20 navigations.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Base-path 404s at launch | MEDIUM | Set `paths.base` + `relative:true`; sweep all internal links/assets to `{base}`-aware or Vite imports; rebuild with prod base; grep output for stray `/` paths |
| Missing `.nojekyll`/fallback | LOW | Add `static/.nojekyll` + `fallback:'404.html'`; redeploy |
| Three.js in Accessible bundle | MEDIUM | Move all `three` imports behind a dynamic `import()` boundary; re-run bundle analysis |
| Inaccessible toggle | LOW–MEDIUM | Rebuild on native `<button aria-pressed>`/radios; add `aria-live` region; add focus styles |
| Contrast failures across dark theme | HIGH | Token-level rework of palette; cascades to every component — why it must be decided up front |
| Mode flash | LOW | Add blocking inline head script reading localStorage/matchMedia; set `<html>` attribute pre-paint |
| WebGL context exhaustion | MEDIUM | Refactor to single persistent canvas + portal; add dispose in `onDestroy` |
| Svelte 5 store not reactive | LOW–MEDIUM | Convert to function-returns-state or const-object pattern; declare class fields with `$state` |
| Broken social cards | LOW | Add prerendered `<svelte:head>` meta with absolute OG URLs; re-scrape via validators |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Base-path link/asset 404 | Phase 1 Foundation/Deploy | Live Pages URL loads with zero 404s; deep-link refresh works |
| `.nojekyll` + SPA 404 fallback | Phase 1 Foundation/Deploy | `_app` chunks load; direct route nav resolves |
| Prerender / trailingSlash failures | Phase 1 (policy) + every route phase | `vite build` clean; all routes prerendered; consistent slashes |
| Mode flash (no-flash persistence) | Phase 1/2 Mode-system | Reload shows zero flicker in either mode |
| Reduced-motion/contrast auto-select | Phase 1/2 Mode-system | OS "Reduce motion" → Accessible loads by default |
| Inaccessible mode toggle | Phase 1/2 Mode-system | Keyboard + NVDA/VoiceOver operate & announce it |
| Svelte 5 runes store traps | Phase 1 Foundation | Mode change propagates; no `state_invalid_export` |
| Contrast / focus / semantics / div-soup | Design-system phase + every UI phase | axe zero contrast/landmark violations; visible focus everywhere |
| Images/labels/link-names | Every content phase | axe zero violations for alt/label/name |
| 3D bundle leak into Accessible | Foundation (architecture) + 3D phase | Bundle visualizer: no `three` in entry chunk |
| Canvas focus-trap / SR exposure | 3D/Premium phase | Tab passes through; SR ignores canvas |
| WebGL leaks / context loss / no fallback | 3D/Premium phase | Stable memory after 20 navs; graceful WebGL-off fallback |
| SEO / social cards | Launch/polish phase | Validators render full card; meta present in view-source |
| Secrets from Notion source committed | Every phase (discipline) | Diff review; no creds/EIN/address in repo |

## Sources

- [Static site generation • SvelteKit Docs (adapter-static, fallback, .nojekyll)](https://svelte.dev/docs/kit/adapter-static) — HIGH
- [sveltejs/kit #4528 — paths.base causes adapter-static 404](https://github.com/sveltejs/kit/issues/4528) — HIGH
- [sveltejs/kit #10358 — subfolder deploy 404s for assets](https://github.com/sveltejs/kit/issues/10358) — HIGH
- [sveltejs/kit #6767 — base + imported assets 404](https://github.com/sveltejs/kit/issues/6767) — HIGH
- [sveltejs/kit #13954 — _app/immutable/chunks 404 on Pages](https://github.com/sveltejs/kit/issues/13954) — HIGH
- [Deploy a SvelteKit website to GitHub Pages — Okupter](https://www.okupter.com/blog/deploy-sveltekit-website-to-github-pages) — MEDIUM
- [Svelte 5 migration guide • Svelte Docs (runes, export restrictions)](https://svelte.dev/docs/svelte/v5-migration-guide) — HIGH
- [$derived • Svelte Docs](https://svelte.dev/docs/svelte/$derived) — HIGH
- [App Structure | Learn Threlte (single canvas, portal via snippets)](https://threlte.xyz/docs/learn/basics/app-structure/) — HIGH
- [Three.js with SvelteKit Integration Guide (dispose in onDestroy, context limits)](https://threejsresources.com/frameworks/three-js-svelte) — MEDIUM
- [three.js #18759 — WebGLRenderer memory leak](https://github.com/mrdoob/three.js/issues/18759) — MEDIUM
- [SSR Theme Switching Without Flash in SvelteKit — JovianMoon](https://jovianmoon.io/posts/ssr-theme-no-flash) — MEDIUM
- [Implementing Dark Mode in SvelteKit — Captain Codeman](https://www.captaincodeman.com/implementing-dark-mode-in-sveltekit) — MEDIUM
- [Dark Mode in SvelteKit with and without JavaScript — David W Parker](https://www.davidwparker.com/posts/dark-mode-in-sveltekit-with-and-without-javascript) — MEDIUM
- WCAG 2.2 (1.1.1, 1.4.3, 1.4.11, 2.1.2 no keyboard trap, 2.3.3 animation from interactions, 2.4.1 skip link, 2.4.7/focus-visible, 3.3.2 labels, 4.1.2/4.1.3 status messages) + WAI-ARIA APG toggle-button/radio patterns — HIGH (canonical standards)
- scope.org.uk (stated accessibility gold-standard reference: skip links, landmarks, focus states) — HIGH (direct reference)
- Personal experience: SvelteKit-on-Pages base-path + prerender deployments — MEDIUM

---
*Pitfalls research for: dual-mode 3D/Accessible SvelteKit static site on GitHub Pages (disability-equity org)*
*Researched: 2026-07-04*

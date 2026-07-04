# Architecture Research

**Domain:** Dual-mode static marketing/mission site (SvelteKit + adapter-static, Premium 3D vs Accessible), GitHub Pages
**Researched:** 2026-07-04
**Confidence:** HIGH (patterns verified against SvelteKit official docs + Threlte/Svelte 5 idioms; a few runtime-behavior details MEDIUM)

## Executive Recommendation

Build **one accessible DOM, themed by a single `data-mode` attribute on `<html>`**, and treat "Premium" vs "Accessible" as a *presentation layer* difference (CSS tokens + a handful of swapped hero components) — **not** two parallel component trees. The only hard code-split boundary in the whole app is the 3D: Threlte/Three.js must live behind a `import()` reached exclusively when `mode === 'premium'`, so Accessible mode ships zero WebGL. Prevent the mode flash with a tiny **render-blocking inline script in `app.html`** that sets `data-mode` before first paint — this is mandatory because the site is prerendered/static and there is no server to read the user's preference.

The three architectural pillars:

1. **`data-mode` on `<html>` is the single source of truth.** Set pre-hydration by inline script, mirrored by a Svelte 5 rune store at runtime. CSS custom properties keyed on `[data-mode="..."]` do ~90% of the visual work.
2. **3D is the only code-split island.** A `PremiumHero` boundary component does `{#if premium}{#await import(...)}` → the Threlte chunk. Accessible mode renders a static `<picture>` poster and never fetches that chunk.
3. **adapter-static + `paths.base` + `fallback: '404.html'` + `.nojekyll`** for GitHub Pages under `/diversityincludesdisability_four`.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  app.html  (prerendered shell)                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ INLINE NO-FLASH SCRIPT (render-blocking, runs before paint)    │  │
│  │  localStorage 'did-mode'  →  else prefers-reduced-motion /      │  │
│  │  prefers-contrast  →  sets  <html data-mode="premium|accessible">│  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│  CSS THEME LAYER   :root[data-mode="premium"]  { --tokens }           │
│                    :root[data-mode="accessible"]{ --tokens }          │
│  (color, contrast, type scale, spacing, motion-duration, radii)       │
├──────────────────────────────────────────────────────────────────────┤
│  +layout.svelte  (ONE accessible DOM)                                 │
│  ┌─────────┐ ┌──────────────┐ ┌─────────┐ ┌──────────────────────┐    │
│  │SkipLinks│ │ModeToggle    │ │ Nav     │ │ aria-live announcer   │    │
│  │         │ │(aria-pressed)│ │         │ │ (polite, visually-hid)│    │
│  └─────────┘ └──────┬───────┘ └─────────┘ └──────────────────────┘    │
│                     │ writes                                          │
│              ┌──────▼───────────────┐  reads  ┌───────────────────┐   │
│              │ mode.svelte.ts (rune)│◄────────┤ every component    │   │
│              │ $state + localStorage│         └───────────────────┘   │
│              └──────────────────────┘                                 │
├──────────────────────────────────────────────────────────────────────┤
│  PAGE CONTENT (semantic, shared)   home · about · services · connect  │
│  ┌────────────────────────┐        content pulled from lib/content/*  │
│  │ PremiumHero (boundary)  │  ─── mode==='premium' ──►  import()      │
│  │                         │                              │           │
│  │  accessible ──► <picture>│                    ┌─────────▼────────┐  │
│  │  premium    ──► HeroScene│                    │ 3D CHUNK          │  │
│  └────────────────────────┘                    │ @threlte/core     │  │
│                                                 │ @threlte/extras   │  │
│                                                 │ three  (lazy)     │  │
│                                                 └───────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Inline `app.html` script | Set `data-mode` pre-paint (no flash) | Synchronous IIFE reading localStorage + `matchMedia` |
| `mode.svelte.ts` store | Runtime source of truth for mode; persist + mirror attribute | Svelte 5 rune class (`$state`) in `.svelte.ts` |
| CSS token layer | Turn one DOM into two experiences | Custom properties under `:root[data-mode=...]` |
| `ModeToggle.svelte` | User control; announce change; keep focus | `<button aria-pressed>` writing `mode.set()` |
| `Announcer.svelte` | Tell AT the mode changed | Visually-hidden `aria-live="polite"` region |
| `PremiumHero.svelte` | Code-split boundary for 3D | `{#if premium}{#await import()}` vs `<picture>` |
| `HeroScene.svelte` | The actual Threlte scene (decorative) | Only file importing `three`/`@threlte/*`; `aria-hidden` |
| `lib/content/*` | Single content source, mode-agnostic | Typed TS data modules |

## Recommended Project Structure

```
diversityincludesdisability_four/
├── svelte.config.js            # adapter-static, paths.base, prerender, 404 fallback
├── .nvmrc                      # pin Node 24
├── package.json                # engines pinned; pnpm
├── static/
│   ├── .nojekyll               # REQUIRED so GH Pages serves _app/ (underscore dirs)
│   ├── hero-poster.webp        # Accessible-mode hero still (zero WebGL)
│   └── favicon / og images
├── src/
│   ├── app.html                # ⭐ inline no-flash script sets data-mode
│   ├── app.css                 # ⭐ theme tokens: :root[data-mode="..."] { --* }
│   ├── app.d.ts
│   ├── lib/
│   │   ├── stores/
│   │   │   └── mode.svelte.ts   # ⭐ rune store: current mode, set(), toggle(), persist
│   │   ├── content/            # single source of truth for copy (mode-agnostic)
│   │   │   ├── site.ts         # org name, email, socials, nav
│   │   │   ├── services.ts     # the 4 services
│   │   │   └── about.ts        # Eman's story blocks
│   │   ├── components/
│   │   │   ├── shell/          # mode-agnostic chrome
│   │   │   │   ├── Header.svelte
│   │   │   │   ├── Footer.svelte
│   │   │   │   ├── Nav.svelte
│   │   │   │   ├── SkipLinks.svelte
│   │   │   │   ├── ModeToggle.svelte
│   │   │   │   └── Announcer.svelte
│   │   │   ├── content/        # shared semantic sections (both modes)
│   │   │   │   ├── ServiceCard.svelte
│   │   │   │   ├── Mission.svelte
│   │   │   │   └── ConnectCTA.svelte
│   │   │   └── premium/        # ⭐ 3D island — the ONLY code-split boundary
│   │   │       ├── PremiumHero.svelte   # boundary: poster vs dynamic import
│   │   │       ├── HeroScene.svelte     # imports three/@threlte — lazy chunk
│   │   │       └── scene/               # meshes, lights, camera rig
│   │   └── a11y/
│   │       └── prefers.ts       # matchMedia helpers (runtime OS-signal reads)
│   └── routes/
│       ├── +layout.ts           # export const prerender = true; trailingSlash
│       ├── +layout.svelte       # ONE accessible DOM: shell + <slot/>
│       ├── +page.svelte         # Home (hero via PremiumHero + shared sections)
│       ├── about/+page.svelte
│       ├── services/+page.svelte
│       └── connect/+page.svelte
```

### Structure Rationale

- **`lib/premium/` isolated:** keeping every `three`/`@threlte` import inside this folder makes the code-split boundary obvious and greppable. A stray top-level `import { T } from '@threlte/core'` anywhere in the shared shell/layout would pull Three.js into the main chunk and defeat the whole "zero WebGL in Accessible mode" requirement. Isolation makes that mistake visible in review.
- **`lib/content/` separate from components:** one content source consumed by shared semantic components guarantees the two modes can never drift — the PROJECT's core "same content, no drift" decision. Copy lives in typed TS, not duplicated markup.
- **`lib/components/content/` are mode-agnostic:** they emit semantic HTML and read theme via CSS variables. They don't branch on mode. Only `premium/` branches.
- **`app.css` holds the token contract:** the entire visual difference is declared in one file, so an accessibility auditor can diff `[data-mode="accessible"]` tokens in isolation.

## Architectural Patterns

### Pattern 1: No-Flash Mode via Inline `app.html` Script (mandatory)

**What:** A synchronous, render-blocking inline script in `<head>` sets `document.documentElement.dataset.mode` *before* the browser paints. Because the site is prerendered (no server), this is the **only** way to avoid a flash of the wrong mode — a server `handle` hook or cookie approach is unavailable on GitHub Pages static hosting.

**When to use:** Always, for any persisted-theme static site. Must be **inline** (not an external `<script src>`) so it is parse-blocking and runs pre-paint.

**Trade-offs:** ~15 lines of untyped vanilla JS duplicated outside the Svelte runtime. Worth it — it is the single thing standing between the user and a jarring flash. Wrap in try/catch and default to `accessible` (the safe, guaranteed-usable mode).

**Example** (`src/app.html`):
```html
<!doctype html>
<html lang="en" data-mode="premium">
  <head>
    <meta charset="utf-8" />
    <script>
      // Runs before first paint. Priority: explicit choice > OS signal > premium.
      (function () {
        try {
          var stored = localStorage.getItem('did-mode');
          var mode;
          if (stored === 'premium' || stored === 'accessible') {
            mode = stored;
          } else {
            var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
            var contrast = matchMedia('(prefers-contrast: more)').matches
                        || matchMedia('(prefers-contrast: custom)').matches;
            mode = (reduce || contrast) ? 'accessible' : 'premium';
          }
          document.documentElement.dataset.mode = mode;
        } catch (e) {
          document.documentElement.dataset.mode = 'accessible';
        }
      })();
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div>%sveltekit.body%</div>
  </body>
</html>
```
Place the script **above** `%sveltekit.head%` (before stylesheets) so tokens resolve on the correct mode from the very first style calc.

### Pattern 2: Svelte 5 Rune Store as Runtime Source of Truth

**What:** A `.svelte.ts` module exporting a `$state`-backed singleton. It initializes *from the attribute the inline script already set* (not from localStorage directly — the inline script already reconciled priority), then owns writes: updating `$state`, persisting to localStorage, and mirroring `data-mode` back onto `<html>`.

**When to use:** The single mode store the whole app subscribes to. Components read `mode.current`; the toggle calls `mode.toggle()`.

**Trade-offs:** Runes in modules require Svelte 5 (Threlte 8 targets Svelte 5, so aligned). Reading the attribute as the init source keeps the inline script as the one place that encodes priority logic — no duplication.

**Example** (`src/lib/stores/mode.svelte.ts`):
```ts
import { browser } from '$app/environment';

export type Mode = 'premium' | 'accessible';
const KEY = 'did-mode';

function initial(): Mode {
  if (!browser) return 'premium';               // prerender default
  const attr = document.documentElement.dataset.mode;
  return attr === 'accessible' ? 'accessible' : 'premium';
}

class ModeState {
  current = $state<Mode>(initial());

  set(next: Mode) {
    this.current = next;
    if (browser) {
      localStorage.setItem(KEY, next);
      document.documentElement.dataset.mode = next; // keep CSS in sync
    }
  }
  toggle() { this.set(this.current === 'premium' ? 'accessible' : 'premium'); }
}

export const mode = new ModeState();
```
Optional enhancement: in `+layout.svelte`, add a `matchMedia(...).addEventListener('change', ...)` that flips to Accessible **only if the user has not made an explicit choice** (`localStorage.getItem('did-mode') === null`), so live OS changes are respected without overriding a deliberate pick.

### Pattern 3: 3D Code-Split Island (the only dynamic import)

**What:** A boundary component renders a static poster in Accessible mode and *dynamically imports* the Threlte scene only in Premium mode. Vite/SvelteKit sees the `import()` and emits `HeroScene` + `three` + `@threlte/*` as a **separate chunk** never fetched in Accessible mode.

**When to use:** Every heavy/WebGL surface. Above-the-fold hero is the primary one; any other 3D uses the same boundary shape.

**Trade-offs:** `{#await}` introduces a momentary loading state on first Premium render — acceptable and can show the poster as the pending state. The hard rule: **never** statically import `three`/`@threlte` outside `lib/components/premium/`, or the chunk merges into main.

**Example** (`src/lib/components/premium/PremiumHero.svelte`):
```svelte
<script lang="ts">
  import { mode } from '$lib/stores/mode.svelte';
  import poster from '$lib/assets/hero-poster.webp'; // or /hero-poster.webp in static/
</script>

{#if mode.current === 'premium'}
  {#await import('./HeroScene.svelte')}
    <img class="hero-poster" src={poster} alt="" aria-hidden="true" />
  {:then { default: HeroScene }}
    <HeroScene />
  {/await}
{:else}
  <picture>
    <img class="hero-poster" src={poster} alt="" aria-hidden="true" />
  </picture>
{/if}
```
`HeroScene.svelte` is the sole file importing `@threlte/core`, `@threlte/extras`, `three`. It is decorative → `aria-hidden` on its container, with the real hero heading/CTA rendered as separate semantic markup *outside* the canvas so screen readers and Accessible mode get identical content.

### Pattern 4: One Accessible DOM, Two CSS Themes (justified over duplicate components)

**What:** Both modes render the *same* semantic HTML. Difference is expressed as CSS custom properties switched by `[data-mode]`, plus a global motion kill-switch.

**Why this over duplicate `PremiumX`/`AccessibleX` components:** (1) **No content drift** — the PROJECT's stated core decision; duplicated trees inevitably diverge. (2) **Accessibility is guaranteed by construction** — there is only one DOM to audit; Premium can't accidentally ship inaccessible markup because it shares the Accessible DOM. (3) **Maintenance halves** — one component, two token sets. (4) The genuinely structural differences (3D hero vs poster, maybe parallax wrappers) are the *only* things component-swapped, and they're already isolated in `premium/`.

**Example** (`src/app.css`):
```css
:root[data-mode="premium"] {
  --bg: #0b1020; --fg: #f5f7ff; --accent: #ff7a1a;
  --motion-duration: 400ms; --type-scale: 1;      /* 3D/parallax lives here */
}
:root[data-mode="accessible"] {
  --bg: #ffffff; --fg: #111111; --accent: #b34700; /* AAA-contrast pair */
  --motion-duration: 0ms;      --type-scale: 1.15;  /* larger text */
}
/* Hard motion kill-switch — belt and suspenders with the OS query */
:root[data-mode="accessible"] *,
@media (prefers-reduced-motion: reduce) { * {
  animation-duration: .001ms !important; transition-duration: .001ms !important;
  scroll-behavior: auto !important;
}}
```

### Pattern 5: Accessible Mode Switch — Announce + Preserve Focus/Scroll

**What:** The toggle is a real `<button aria-pressed={...}>` that (a) flips mode via attribute only — **no navigation**, so scroll position and DOM identity are preserved and there is no reflow jump; (b) writes a message into a visually-hidden `aria-live="polite"` region so AT announces "Accessible mode enabled"; (c) leaves focus on the toggle (it doesn't disappear, since it exists in both modes).

**When to use:** The single mode control (place in header, persistent).

**Trade-offs:** `aria-pressed` communicates a two-state toggle cleanly. Because mode is a CSS/attribute flip rather than a route change, scroll and focus are inherently preserved — avoid any pattern that re-mounts the page (e.g. keying the layout on mode) as that would blow away scroll/focus.

**Example** (`ModeToggle.svelte` + `Announcer.svelte`):
```svelte
<!-- ModeToggle.svelte -->
<script lang="ts">
  import { mode } from '$lib/stores/mode.svelte';
  import { announce } from '$lib/stores/announcer.svelte';
  function onClick() {
    mode.toggle();
    announce(mode.current === 'accessible'
      ? 'Accessible mode enabled. Motion reduced, high contrast.'
      : 'Premium mode enabled. Immersive visuals on.');
  }
</script>
<button type="button" aria-pressed={mode.current === 'accessible'} onclick={onClick}>
  {mode.current === 'accessible' ? 'Accessible mode' : 'Premium mode'}
</button>

<!-- Announcer.svelte (rendered once in +layout.svelte) -->
<div aria-live="polite" class="sr-only">{message}</div>
```

## Data Flow

### Mode-State Flow (the central flow)

```
Page load (prerendered HTML, data-mode="premium" static default)
    ↓
Inline app.html script  → reads localStorage 'did-mode'
    ↓ (miss) → matchMedia prefers-reduced-motion / prefers-contrast
    ↓
sets <html data-mode="premium|accessible">   ← BEFORE paint (no flash)
    ↓
CSS token layer resolves correct theme on first style calc
    ↓
SvelteKit hydrates → mode.svelte.ts initializes current = <html>.dataset.mode
    ↓
User clicks ModeToggle → mode.set(next)
    ├─ $state update      → all subscribers re-render
    ├─ localStorage write → persists choice
    ├─ <html data-mode>   → CSS re-themes (no reflow/navigation)
    └─ announce()         → aria-live polite region → AT speaks
    ↓
PremiumHero reacts: premium → import('./HeroScene') (lazy chunk)
                    accessible → static <picture>, chunk never fetched
```

### Build / Deploy Flow (GitHub Pages)

```
pnpm build (adapter-static)
    ↓
prerender ALL routes → home/ about/ services/ connect/ (+ index.html each)
    ↓
emit fallback 404.html  (client router recovers deep links / unknown paths)
    ↓
paths.base = '/diversityincludesdisability_four' baked into links & asset URLs
    ↓
static/.nojekyll copied → GH Pages serves _app/ underscore dirs
    ↓
push build/ to gh-pages (or Actions artifact) → https://<user>.github.io/diversityincludesdisability_four/
```

**`svelte.config.js`:**
```js
import adapter from '@sveltejs/adapter-static';
const dev = process.argv.includes('dev');
export default {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: { base: dev ? '' : '/diversityincludesdisability_four' },
    prerender: { entries: ['*'] }
  }
};
```
**`src/routes/+layout.ts`:** `export const prerender = true;` and consider `export const trailingSlash = 'always';` (GH Pages serves `/a/` → `/a/index.html` reliably).

**Base-path discipline:** never hardcode `/about` in `href`/`src`. Use `import { base } from '$app/paths'` → `href="{base}/about"`, or rely on relative links + SvelteKit's link resolution. In `app.html`, use `%sveltekit.assets%` for any static asset. Getting this wrong is the #1 GH Pages base-path bug (broken links/assets on deploy, fine locally).

## Scaling Considerations

This is a static content site — "scale" is payload and Lighthouse, not concurrent users. GitHub Pages CDN handles traffic.

| Concern | Approach |
|---------|----------|
| Accessible-mode payload | Zero WebGL by construction (code-split). Keep main chunk lean; poster as WebP/AVIF. |
| Premium first paint | Poster is the `{#await}` pending state; lazy-load 3D so first paint < ~1.5s. |
| More 3D surfaces later | Reuse the `PremiumHero` boundary shape; each is its own chunk. |
| Content growth | `lib/content/*` typed modules scale fine; consider mdsvex only if long-form articles appear. |

### Priorities

1. **First thing that "breaks":** accidental static `three` import leaking into main chunk → run `pnpm build` and inspect chunk output; assert Accessible mode fetches no `three*.js`.
2. **Second:** base-path regressions on deploy → smoke-test the deployed URL, not just `pnpm dev`.

## Anti-Patterns

### Anti-Pattern 1: Two parallel component trees (PremiumHome / AccessibleHome)
**What people do:** Duplicate every page/section per mode.
**Why it's wrong:** Content drifts; you now maintain and audit two DOMs; Premium can ship inaccessible markup unnoticed.
**Do this instead:** One semantic DOM, CSS-token themes; component-swap *only* the 3D-vs-poster hero.

### Anti-Pattern 2: Static top-level import of Threlte/Three in shared code
**What people do:** `import { Canvas } from '@threlte/core'` in `+layout.svelte` or a shared component.
**Why it's wrong:** Vite bundles Three.js into the main chunk → Accessible mode ships WebGL, violating a hard requirement.
**Do this instead:** Confine all `three`/`@threlte` imports to `lib/components/premium/`, reached only via `import()`.

### Anti-Pattern 3: Reading mode only in a Svelte store / onMount
**What people do:** Set the theme in `onMount` or a store subscription after hydration.
**Why it's wrong:** Runs after first paint → visible flash of the wrong mode (worst case: motion flashes for a reduced-motion user).
**Do this instead:** Inline render-blocking script in `app.html` sets `data-mode` pre-paint; store initializes *from* that attribute.

### Anti-Pattern 4: Switching mode via navigation or re-keying the layout
**What people do:** `goto('?mode=accessible')` or `{#key mode}` around the page.
**Why it's wrong:** Re-mounts the tree → loses scroll position and focus; jarring for keyboard/AT users.
**Do this instead:** Flip the `data-mode` attribute in place; announce via `aria-live`; focus stays on the toggle.

### Anti-Pattern 5: Forgetting `.nojekyll`
**What people do:** Deploy `build/` without `static/.nojekyll`.
**Why it's wrong:** GH Pages' Jekyll ignores `_app/` (leading underscore) → site 404s its own JS/CSS.
**Do this instead:** Commit `static/.nojekyll`; adapter copies it to output.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Inline script ↔ rune store | via `<html data-mode>` attribute | Attribute is the handoff; script owns priority logic, store owns writes |
| Rune store ↔ components | `mode.current` ($state read) | Reactive; toggle is the only writer path users touch |
| PremiumHero ↔ HeroScene | `import()` dynamic boundary | The single code-split seam; keeps Three.js out of Accessible payload |
| Content ↔ components | typed TS imports from `lib/content` | One source → no mode drift |
| Toggle ↔ AT | `aria-live` polite region | Announces mode change without moving focus |

### External Services

| Service | Integration | Notes |
|---------|-------------|-------|
| GitHub Pages | static host, base path | `.nojekyll`, `404.html` fallback, `paths.base` |
| (none else) | — | No backend/CMS/DB per PROJECT scope |

## Suggested Build Order (for roadmap phasing)

1. **Foundation** — Scaffold SvelteKit + adapter-static + pnpm + Node pin; `svelte.config.js` base path; `app.html` inline no-flash script; `mode.svelte.ts` rune store; `app.css` token contract for both modes; layout shell with SkipLinks + ModeToggle + Announcer. *Deliverable: mode toggle flips themes with no flash, no 3D yet.* Avoids Anti-Patterns 1, 3, 4 up front.
2. **Content & Accessibility (Accessible mode as gold standard first)** — `lib/content/*`, all pages (home/about/services/connect) as one semantic DOM, static poster hero, WCAG 2.2 AA+ pass, keyboard/AT audit, prefers-reduced-motion/contrast defaults verified. *Accessible mode must be fully shippable here* — it is the guaranteed-usable baseline.
3. **Premium & 3D** — `PremiumHero` boundary + `HeroScene` Threlte island behind `import()`; verify build output shows a separate `three` chunk not fetched in Accessible mode; tasteful motion tied to `--motion-duration` tokens. Avoids Anti-Pattern 2.
4. **Build & Deploy** — Prerender all routes, `404.html` fallback, `.nojekyll`, base-path link/asset audit, GH Pages publish, smoke-test the *deployed* URL (not just dev).

Rationale: theme/state plumbing must exist before content so pages are mode-aware from day one; Accessible mode ships before 3D so the guaranteed-usable experience is proven independent of WebGL; deploy last once base-path-sensitive links are stable.

## Sources

- SvelteKit adapter-static (fallback, prerender, base path) — https://svelte.dev/docs/kit/adapter-static (HIGH)
- SvelteKit configuration (`paths.base`, `trailingSlash`, prerender) — https://svelte.dev/docs/kit/configuration (HIGH)
- Base-path 404 pitfalls — https://github.com/sveltejs/kit/issues/4528 , https://github.com/sveltejs/kit/discussions/11554 (MEDIUM)
- Deploy SvelteKit to GitHub Pages — https://www.okupter.com/blog/deploy-sveltekit-website-to-github-pages (MEDIUM)
- No-flash SSR theme switching — https://jovianmoon.io/posts/ssr-theme-no-flash , https://www.swyx.io/avoid-fotc (MEDIUM)
- Threlte (Three.js for Svelte, Svelte 5) — https://threlte.xyz/ , https://github.com/threlte/threlte (HIGH)
- Svelte 5 runes lazy-loading via `import()` + `{#await}` — https://www.richardfu.net/efficient-lazy-loading-in-svelte-a-practical-guide-for-svelte-4-and-svelte-5-runes/ (MEDIUM)
- prefers-reduced-motion / prefers-contrast — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion , https://web.dev/articles/prefers-reduced-motion (HIGH)
- prefers-reduced-motion store in Svelte — https://geoffrich.net/posts/svelte-prefers-reduced-motion-store/ (MEDIUM)

---
*Architecture research for: dual-mode SvelteKit static site (Premium 3D vs Accessible)*
*Researched: 2026-07-04*

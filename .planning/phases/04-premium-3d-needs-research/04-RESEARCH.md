# Phase 4: Premium 3D - Research

**Researched:** 2026-07-05
**Domain:** Threlte 8 / Three.js hero island, lazily code-split behind Premium mode in a SvelteKit adapter-static site
**Confidence:** HIGH on the lazy-import boundary and validation; HIGH on the Threlte 8 API (verified against threlte.xyz); MEDIUM on disposal internals (one doc page 404'd — mitigated with explicit belt-and-suspenders teardown)

## Summary

Phase 4 adds exactly ONE decorative Threlte hero that renders only in Premium mode on a WebGL-capable, motion-allowing device. Every other outcome (Accessible mode, reduced-motion, no WebGL, context loss, import failure) falls back to the **existing static poster already shipped in `Hero.svelte`** — so the fallback slot is done and content never depends on the canvas.

The whole phase hinges on one hard architectural rule: **`three` and `@threlte/*` may only be imported by files under `src/lib/components/premium/`, and those files may only be reached through a dynamic `import()`.** A single static top-level `import` anywhere in the shared graph pulls ~150 KB of WebGL into the Accessible entry bundle and fails PREM-02. The boundary is greppable and machine-verifiable, and this research specifies the exact grep-the-build proof.

The recommended scene is **procedural, not asset-based**: an instanced glowing particle field plus a few wireframe "echo rings" that mirror the poster's concentric-arc motif, lit by one blue (`#6FB4FF`) and one orange (`#FF9E5E`) point light against the `#0A0E14` canvas. No GLTF/textures → the premium chunk stays lean and there is nothing to license or fail to load. Motion is a slow ambient drift, paused when the tab is hidden or the canvas scrolls offscreen, capped at DPR 1.5, and never shown under `prefers-reduced-motion`.

**Primary recommendation:** Build `premium/PremiumHero.svelte` (a tiny, three-free boundary that gates on `mode==='premium' && !reduced-motion && webglSupported`, then `{#await import('./HeroScene.svelte')}`) overlaid absolutely on the existing poster; put ALL three/@threlte inside `HeroScene.svelte`; use Threlte's single `<Canvas renderMode="on-demand" dpr={[1,1.5]}>` with a `useTask` loop whose `running` flag is gated on visibility/onscreen; dispose explicitly in `onDestroy`; and prove the split with a build-grep script + Playwright network/canvas/dispose tests.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PREM-01 | Premium mode renders a tasteful Threlte hero with restrained motion | Scene concept (procedural instanced particles + echo rings + 2 glow lights), `useTask` ambient-drift loop tied to a `--motion` budget, DPR cap, on-demand render — §Scene Design |
| PREM-02 | three/@threlte loaded ONLY via dynamic `import()` gated on Premium mode; verifiably absent from the Accessible entry bundle (zero WebGL) | Lazy-import boundary + quarantine rule + build-grep proof + runtime network test — §Lazy-Import Boundary, §Validation Architecture |
| PREM-04 | Dispose WebGL on unmount/route-change + graceful context-loss handling (no leaks, no crash) | Single-Canvas lifecycle, Threlte auto-disposal + explicit `renderer.dispose()`/`forceContextLoss()` in `onDestroy`, `webglcontextlost` listener → poster, WebGL feature-detect before import — §Disposal & Failure Handling, §Validation Architecture |
| PREM-03 | (Phase 3, COMPLETE) Static poster fallback with no content loss | The poster in `Hero.svelte` is the permanent fallback slot for every non-render path — reused, not rebuilt |
</phase_requirements>

## Standard Stack

### Core (add to the project — all currently the latest on npm, re-verified 2026-07-05)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.185.1 | WebGL engine under Threlte | Tree-shakeable ESM; import only the classes the scene uses. Lock minor to `@types/three`. |
| @threlte/core | 8.5.16 | Declarative Three.js for Svelte 5 runes | Threlte 8 is the Svelte-5/runes-native major. Provides `<Canvas>`, `<T>`, `useTask`, `useThrelte`. Peers `svelte>=5`, `three>=0.160` — satisfied. |
| @types/three | 0.185.0 | Three types (dev) | Match the `three` minor exactly (`0.185.x`). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @threlte/extras | 9.21.0 | `<Float>`, `<OrbitControls>`, `useTexture`, `<Environment>` | **Recommended: OMIT for this phase.** The scene is a non-interactive ambient drift — we do NOT want `<OrbitControls>` (adds tab focus / pointer capture / focus-trap risk, Pitfall 4) and the gentle float is trivially done with `useTask`. Adding extras only bloats the premium chunk. Add later only if a specific helper earns its weight. |

**Installation (pnpm — project convention):**
```bash
pnpm add three@0.185.1 @threlte/core@8.5.16
pnpm add -D @types/three@0.185.0
# @threlte/extras@9.21.0 intentionally NOT installed (see table)
```

**Version verification (run before committing the plan):**
```bash
npm view three version          # expect 0.185.1
npm view @threlte/core version  # expect 8.5.16
npm view @types/three version   # expect 0.185.0
```
All three verified against the live npm registry on 2026-07-05.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Threlte 8 declarative | Raw `three` in `onMount` | Raw three means hand-managing the render loop, resize, and disposal. Threlte's managed loop + auto-disposal is safer for PREM-04. Use raw three only for a truly trivial one-off — this scene isn't. |
| Procedural particles/rings | GLTF model (draco/meshopt) | A model adds an asset fetch (can fail → another fallback path), licensing/provenance concern (Pitfalls §Security), draco/loader weight in the chunk, and LCP risk. Procedural is lighter, cannot 404, and echoes the existing poster. **Decision: procedural.** |
| `motion` lib for parallax | `useTask` + pointer lerp | The only motion is inside the already-lazy premium chunk. A tiny pointer-lerp in `useTask` needs zero extra dependency. Skip `motion` for Phase 4. |

## Lazy-Import Boundary (PREM-02 — the load-bearing pattern)

### The seam (matches the comment already in `Hero.svelte`)
`Hero.svelte` keeps its poster + real headline/subhead/CTA untouched. It statically imports a **three-free** boundary component and renders it absolutely positioned over `.hero__poster`:

```svelte
<!-- src/lib/components/Hero.svelte  (add to existing markup) -->
<script lang="ts">
  import PremiumHero from '$lib/components/premium/PremiumHero.svelte'; // three-FREE, safe static import
  /* ...existing imports... */
</script>

<section class="hero">
  <svg class="hero__poster" aria-hidden="true" ...>...</svg>  <!-- unchanged: permanent fallback -->
  <PremiumHero />                                              <!-- overlays poster only when it mounts a canvas -->
  <div class="hero__content"> ...unchanged h1/subhead/CTA... </div>
</section>
```

`PremiumHero.svelte` is the boundary. It imports **nothing** from three/@threlte — it only decides whether to dynamically import the scene:

```svelte
<!-- src/lib/components/premium/PremiumHero.svelte  (NO three import here) -->
<script lang="ts">
  import { mode } from '$lib/stores/mode.svelte';
  import { prefersReducedMotion, webglSupported } from '$lib/a11y/prefers.svelte';

  // Show the 3D scene ONLY when: Premium mode AND motion allowed AND WebGL present.
  // Any false → render nothing here; the poster underneath is the fallback (PREM-03/04).
  const show3D = $derived(
    mode.current === 'premium' && !prefersReducedMotion.current && webglSupported()
  );
</script>

{#if show3D}
  {#await import('./HeroScene.svelte')}
    <!-- pending: render nothing; poster shows through -->
  {:then { default: HeroScene }}
    <HeroScene />
  {:catch}
    <!-- import/runtime failure: render nothing; poster shows through (no content loss) -->
  {/await}
{/if}
```

```svelte
<!-- src/lib/components/premium/HeroScene.svelte  ← the ONLY file that imports three/@threlte -->
<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from './scene/Scene.svelte';
</script>
<div class="scene" aria-hidden="true">
  <Canvas renderMode="on-demand" dpr={[1, 1.5]}>
    <Scene />
  </Canvas>
</div>
<style>
  .scene { position:absolute; inset:0; pointer-events:none; } /* decorative, no pointer/AT capture */
  .scene :global(canvas) { width:100%; height:100%; }
</style>
```

### Quarantine rules (each is a PREM-02 failure if broken)
- **Only** files under `src/lib/components/premium/` may `import` from `three` or `@threlte/*`.
- Those files are reachable **only** via the single `import('./HeroScene.svelte')` in `PremiumHero.svelte`. No other module may statically import `HeroScene.svelte` or anything it imports.
- `PremiumHero.svelte` itself must stay three-free (it is statically imported by `Hero.svelte`, which is in the Accessible graph). Verified by the boundary above — it imports only the store + the a11y helper.
- Do NOT add `three`/`@threlte` to `optimizeDeps`, a shared util, `+layout.svelte`, or any content component.

### Why this produces a separate chunk
Vite/SvelteKit treats a dynamic `import()` as a code-split point: `HeroScene` + `three` + `@threlte/core` land in their own hashed chunk under `build/_app/immutable/` that is fetched **only** when `import()` runs (i.e., only in Premium + motion + WebGL). The home route's prerendered HTML `modulepreload`s only its *static* dependency graph, which excludes the premium chunk. This is documented framework behavior (HIGH confidence).

### Verification method (the proof, not a vibe) — see §Validation Architecture for full code
1. `pnpm build`.
2. Grep every `build/_app/immutable/**/*.js` for `@threlte`/`WebGLRenderer`. Assert ≥1 chunk matches (**the premium chunk exists**) — this proves the code is present but split out.
3. Parse `build/index.html` (prerendered Home = the entry). Collect every chunk it references via `<link rel="modulepreload">` and `<script type="module">`. Assert **none** of those referenced chunks contain `@threlte`/`WebGLRenderer` (**three is not in the Accessible critical path**).
4. Runtime cross-check (Playwright): in Accessible mode, load `/`, and assert no downloaded JS response body contains `THREE.WebGLRenderer`; in Premium+motion, assert one does.

## Scene Design (PREM-01 — luminous depth, restrained)

**Concept — "the poster, brought to life."** The static poster is concentric arcs radiating from an upper-right focal point + two intersecting accent rings + small luminous nodes. The 3D scene is the moving version of that same motif, so Premium reads as a continuation of the fallback, not a different picture:

- **Instanced glowing particle field** (`THREE.InstancedMesh`, ~200–350 small spheres/points) drifting slowly, denser near the upper-right focal point — the "nodes" made ambient. One instanced mesh = one draw call = cheap.
- **2–3 wireframe echo rings** (`THREE.RingGeometry`/`TorusGeometry`, wireframe or thin emissive) at different depths, rotating very slowly — the concentric arcs.
- **Two point lights**: blue `#6FB4FF` (upper-right, matching poster focal point) and orange `#FF9E5E` (lower-left), low intensity, giving the glassy "luminous depth" glow. Plus a dim ambient so nothing is pure black.
- **Background** stays the token `#0A0E14` (renderer `setClearColor`/transparent so the CSS `--bg` shows through — prefer `<Canvas>` transparent + CSS bg to avoid a hardcoded hex in JS).
- **Optional gentle parallax**: lerp the camera a few pixels toward pointer position in `useTask`. Subtle, non-vestibular, and it only exists in motion-allowed Premium anyway.

**Threlte component structure** (all under `premium/scene/`):
```
scene/
├── Scene.svelte        # <T.PerspectiveCamera makeDefault position={[0,0,6]} />, lights, children; owns the useTask drift loop
├── ParticleField.svelte# <T.InstancedMesh> of ~300 instances; per-frame position/opacity drift
├── EchoRings.svelte    # 2–3 <T.Mesh> ring/torus wireframes at varying z; slow rotation
└── Lights.svelte       # <T.PointLight color=... /> ×2 + <T.AmbientLight intensity=low/>
```

**Motion loop (`useTask`)** — Threlte 8 API verified against threlte.xyz:
```ts
import { useTask, useThrelte } from '@threlte/core';
// `running` gates the loop → when false, on-demand render pauses (0 GPU). See §Perf.
useTask((delta) => {
  // advance drift; keep amplitude tiny (restrained). delta-based so it's frame-rate independent.
}, { running: () => running.current /* visible && onscreen */ });
```
`useTask` auto-invalidates each frame while running, which drives the `renderMode="on-demand"` canvas; stop `running` and rendering halts. Tasks are torn down with the component (they register through Threlte's lifecycle context).

**Decorative-only guarantees (Pitfall 4):**
- Wrapper and canvas are `aria-hidden="true"`; `pointer-events:none`; no `tabindex`, no `<OrbitControls>` → not focusable, not in the tab order, not announced.
- The real `<h1>`/subhead/CTA remain separate semantic DOM in `Hero.svelte`, outside the canvas — Accessible-tree users get 100% of the content. No essential action is attached to a 3D object.

## Reduced-Motion, WebGL-Support & Fallback (PREM-01, PREM-04)

**Gate on BOTH mode AND reduced-motion.** Reduced-motion already auto-selects Accessible on first visit *when there is no stored choice*, but a user can explicitly pick Premium while running `prefers-reduced-motion: reduce`. Requirement SC-1 says "no motion under reduced-motion, even in Premium." So `PremiumHero` checks reduced-motion independently of mode and shows the static poster instead of the canvas when reduce is set. (An alternative — render the scene once, frozen — is riskier and pointless here; the poster IS the frozen scene.)

**Reactive helper** `src/lib/a11y/prefers.svelte.ts` (rune module, browser-guarded, listens for live changes):
```ts
import { browser } from '$app/environment';

class PrefersReducedMotion {
  current = $state(false);
  constructor() {
    if (!browser) return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    this.current = mq.matches;
    mq.addEventListener('change', (e) => (this.current = e.matches)); // mid-session OS toggle respected
  }
}
export const prefersReducedMotion = new PrefersReducedMotion();

// Cheap synchronous WebGL feature-detect BEFORE importing three (avoid loading 150KB to fail).
let _webgl: boolean | null = null;
export function webglSupported(): boolean {
  if (!browser) return false;
  if (_webgl !== null) return _webgl;
  try {
    const c = document.createElement('canvas');
    _webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { _webgl = false; }
  return _webgl;
}
```

**Fallback matrix — every non-render path lands on the existing poster with zero content loss:**
| Condition | Result |
|-----------|--------|
| Accessible mode | `show3D=false` → no import, no canvas, poster shows (already true today) |
| Premium + `prefers-reduced-motion: reduce` | `show3D=false` → poster; no autoplay motion (SC-1) |
| Premium + motion, WebGL unsupported | `webglSupported()===false` → no import, poster |
| Dynamic `import()` fails (network/chunk error) | `{:catch}` → render nothing, poster shows through |
| `webglcontextlost` at runtime | listener `preventDefault()` + retreat to poster (below) |

**Context-loss handling** inside `HeroScene`/`Scene` (three's `WebGLRenderer` has default lost/restored handling, but we add an explicit retreat so a dead canvas is never shown):
```ts
const { renderer } = useThrelte();
const canvas = renderer.domElement;
function onLost(e: Event) { e.preventDefault(); contextLost = true; } // → parent hides scene, poster shows
canvas.addEventListener('webglcontextlost', onLost, false);
// onDestroy: removeEventListener(...)
```
Surface `contextLost` up to `PremiumHero` (prop/callback/shared rune) so the `{#if show3D && !contextLost}` collapses to the poster. Since the poster is always mounted underneath, the transition is seamless.

## Disposal & Failure Handling (PREM-04 — no leaks, single canvas)

**This site has ONE 3D surface, on the Home route only.** Client-side nav Home→About unmounts `Hero` → `PremiumHero` → `HeroScene` → `<Canvas>`. There is no per-route canvas churn and no need for a global portal canvas; the single-canvas concern is satisfied by there being exactly one, mounted only on Home. The leak risk is repeated Home↔About navigation re-creating and (if not disposed) accumulating GL contexts toward the browser's ~8–16 cap ("Too many active WebGL contexts").

**Threlte auto-disposal (MEDIUM-HIGH confidence):** Threlte's `<T>` disposes the underlying geometry/material when it unmounts (`dispose` defaults on), and `<Canvas>` owns the renderer it created. *(The dedicated disposal doc page 404'd during research, so treat auto-disposal as necessary-but-not-solely-trusted and add the explicit teardown below.)*

**Explicit belt-and-suspenders teardown** in `HeroScene`/`Scene` `onDestroy` — makes PREM-04 deterministic regardless of auto-dispose details:
```ts
import { onDestroy } from 'svelte';
import { useThrelte } from '@threlte/core';
const { renderer } = useThrelte();
onDestroy(() => {
  try {
    renderer.dispose();          // frees renderer-held GL resources + programs
    renderer.forceContextLoss(); // immediately releases the GL context (frees a slot vs the ~8–16 cap)
  } catch { /* already gone */ }
});
```
Also dispose any geometry/material/texture you created imperatively (InstancedMesh geometry/material) — declare them via `<T>` so Threlte disposes them, or keep references and `.dispose()` them in `onDestroy`. Remove the `webglcontextlost` listener in `onDestroy`.

**Pause when hidden/offscreen (perf + battery):** gate the `useTask` `running` flag on `document.visibilityState==='visible'` AND an `IntersectionObserver` on the canvas wrapper (onscreen). With `renderMode="on-demand"`, stopping the task stops invalidation → rendering fully halts (0 GPU) when the tab is backgrounded or the hero scrolls away.

## Perf Budget

| Lever | Setting | Why |
|-------|---------|-----|
| DPR | `dpr={[1, 1.5]}` on `<Canvas>` | Clamp device pixel ratio to 1.5 max — biggest fill-rate win on hi-DPI/low-end. Threlte `dpr` accepts a `[min,max]` tuple. |
| Render mode | `renderMode="on-demand"` (default) | Renders only when the task invalidates; pausing the task = 0 GPU. |
| Pause offscreen/hidden | `IntersectionObserver` + `visibilitychange` → `running=false` | No battery/fan drain when not visible (Pitfall 9/Perf traps). |
| Geometry | 1 `InstancedMesh` (~300 instances) + 2–3 rings | Minimal draw calls; no textures, no GLTF. |
| Motion | tiny amplitude, `delta`-based, restrained | Non-vestibular; ties to the design's motion budget. |
| Premium chunk size target | **< 200 KB gzipped** (three core + @threlte/core, no extras, no assets) | Keeps first Premium paint fast; poster covers the `{#await}` gap. Measure with `rollup-plugin-visualizer` or the build-grep script's byte report. |

## Concrete File List (for the planner)

**New (all under the quarantine folder unless noted):**
- `src/lib/components/premium/PremiumHero.svelte` — three-free boundary; gates on mode+reduced-motion+WebGL; `{#await import('./HeroScene.svelte')}`; handles `{:catch}` + context-lost → poster.
- `src/lib/components/premium/HeroScene.svelte` — the ONLY three/@threlte importer; `<Canvas renderMode="on-demand" dpr={[1,1.5]}>`; explicit `onDestroy` disposal; `webglcontextlost` listener.
- `src/lib/components/premium/scene/Scene.svelte` — camera + lights + children + `useTask` drift loop + `running` gate.
- `src/lib/components/premium/scene/ParticleField.svelte` — instanced glow particles.
- `src/lib/components/premium/scene/EchoRings.svelte` — wireframe concentric rings.
- `src/lib/components/premium/scene/Lights.svelte` — blue + orange point lights + dim ambient.
- `src/lib/a11y/prefers.svelte.ts` — reactive `prefersReducedMotion` + `webglSupported()`.
- `tests/premium-hero.spec.ts`, `tests/premium-bundle.spec.ts`, `tests/premium-dispose.spec.ts` — see below.
- `scripts/check-premium-split.mjs` — build-grep bundle proof.

**Modified:**
- `src/lib/components/Hero.svelte` — add the static `import PremiumHero` + `<PremiumHero />` overlay (poster and content markup unchanged).
- `package.json` — add `three@0.185.1`, `@threlte/core@8.5.16` (deps), `@types/three@0.185.0` (dev); add `"test:split": "node scripts/check-premium-split.mjs"`; wire it into the `test` script after `build`.

## Common Pitfalls

### Pitfall 1: A single static `three`/`@threlte` import leaks WebGL into Accessible (PREM-02 fail)
**What goes wrong:** any top-level import of three/@threlte in `Hero.svelte`, `PremiumHero.svelte`, a layout, or a shared util merges the WebGL chunk into the entry bundle; tree-shaking can't remove a statically-imported module. **Avoid:** quarantine to `premium/`, reach only via `import()`, keep `PremiumHero` three-free. **Warning sign:** the build-grep test finds `@threlte` in a modulepreloaded home chunk.

### Pitfall 2: Canvas focusable / announced (Pitfall 4 from PITFALLS.md)
**Avoid:** `aria-hidden` wrapper, no `tabindex`, no `<OrbitControls>`, `pointer-events:none`. **Warning sign:** Tab reaches the hero and stops; axe flags a focusable element with no name.

### Pitfall 3: WebGL context accumulation across nav (PREM-04 fail)
**Avoid:** explicit `renderer.dispose()` + `forceContextLoss()` in `onDestroy`. **Warning sign:** "Too many active WebGL contexts" after ~8–16 Home↔About cycles; the dispose test catches this via a console listener.

### Pitfall 4: Motion plays under reduced-motion because mode was checked but the media query wasn't
**Avoid:** independent `prefersReducedMotion` check in the boundary. **Warning sign:** canvas mounts with OS reduce-motion on.

### Pitfall 5: Playwright's default hides/exposes the canvas unexpectedly
Playwright defaults `reducedMotion: 'no-preference'` (verified), so the canvas mounts in Premium tests by default — good, but **pin it explicitly** (`test.use({ reducedMotion: ... })` / `page.emulateMedia`) in every premium test so runs are deterministic and the reduced-motion fallback path is actually exercised.

## Validation Architecture

> nyquist_validation is enabled in config.json. Each requirement maps to an automated assertion. Tests run against the **production build via `pnpm preview`** (existing `playwright.config.ts` webServer) — the same artifact shipped to Pages. Existing suite lives in `tests/*.spec.ts` (Playwright 1.61.1 + `@axe-core/playwright` 4.12.1). Wait for `html[data-hydrated="true"]` before interacting (existing harness convention), then `await expect(canvas).toBeVisible()` since the scene mounts after an async `import()`.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.61.1 (`@playwright/test`) + `@axe-core/playwright` 4.12.1 + Node scripts (`scripts/*.mjs`) |
| Config file | `playwright.config.ts` (webServer = `pnpm build && pnpm preview`; chromium) |
| Quick run command | `pnpm exec playwright test tests/premium-hero.spec.ts` |
| Full suite command | `pnpm test` (check + lint + tokens + content + build + review + e2e); add `pnpm test:split` after `build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PREM-02 | Premium chunk exists AND no three/@threlte in the Accessible/home critical bundle | build-grep (Node) | `node scripts/check-premium-split.mjs` | ❌ Wave 0 |
| PREM-02 | Accessible mode downloads no three chunk; Premium+motion does | e2e network | `playwright test tests/premium-bundle.spec.ts` | ❌ Wave 0 |
| PREM-01/03 | Accessible → no `<canvas>` + poster; Premium+motion → `<canvas>` visible; Premium+reduce → poster, no canvas | e2e | `playwright test tests/premium-hero.spec.ts` | ❌ Wave 0 |
| PREM-04 | Nav Home↔About ×15 → canvas removed on leave, re-created on return, **zero console errors** ("Too many active WebGL contexts" never fires) | e2e | `playwright test tests/premium-dispose.spec.ts` | ❌ Wave 0 |
| PREM-04 | Forced `webglcontextlost` → poster fallback, no crash, content intact | e2e | `playwright test tests/premium-dispose.spec.ts` | ❌ Wave 0 |
| PREM-01/PREM-03 | axe zero-violations in Premium **with canvas present** (decorative `aria-hidden`, not focusable) | e2e a11y | `playwright test tests/premium-hero.spec.ts` (or extend `a11y.spec.ts`) | ⚠ extend existing |

### Test blueprints (for the planner/executor)

**`scripts/check-premium-split.mjs` (PREM-02 build proof):**
```js
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const DIR = 'build/_app/immutable';
const MARK = /@threlte|WebGLRenderer/;
const js = [];
(function walk(d){ for (const e of readdirSync(d,{withFileTypes:true})){
  const p = join(d,e.name); e.isDirectory()?walk(p):e.name.endsWith('.js')&&js.push(p);} })(DIR);
const premium = js.filter((f)=>MARK.test(readFileSync(f,'utf8')));
if (premium.length===0){ console.error('FAIL: no three/@threlte chunk found — split missing or scene not built'); process.exit(1); }
// Home = the Accessible entry. Collect chunks it preloads/loads, assert none is a premium chunk.
const home = readFileSync('build/index.html','utf8');
const referenced = [...home.matchAll(/_app\/immutable\/[^"']+\.js/g)].map((m)=>m[0]);
const leaked = referenced.filter((r)=> premium.some((p)=> p.replace(/\\/g,'/').endsWith(r)));
if (leaked.length){ console.error('FAIL: three/@threlte reachable from home critical bundle:\n'+leaked.join('\n')); process.exit(1); }
console.log(`OK: ${premium.length} premium chunk(s) split out; home bundle is WebGL-free`);
```

**`tests/premium-bundle.spec.ts` (PREM-02 runtime):**
```ts
import { test, expect } from '@playwright/test';
test('Accessible mode downloads zero three chunks', async ({ page }) => {
  const bodies: string[] = [];
  page.on('response', async (r) => { if (r.url().endsWith('.js')) bodies.push(await r.text().catch(()=>'')); });
  await page.addInitScript(() => localStorage.setItem('did-mode','accessible'));
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(page.locator('canvas')).toHaveCount(0);
  expect(bodies.some((b)=>/@threlte|THREE\.WebGLRenderer/.test(b))).toBe(false);
});
test('Premium+motion downloads a three chunk and mounts a canvas', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem('did-mode','premium'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const bodies: string[] = [];
  page.on('response', async (r) => { if (r.url().endsWith('.js')) bodies.push(await r.text().catch(()=>'')); });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(page.locator('canvas')).toBeVisible();
  expect(bodies.some((b)=>/@threlte|THREE\.WebGLRenderer/.test(b))).toBe(true);
});
```

**`tests/premium-hero.spec.ts` (PREM-01/03 + decorative axe):**
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('accessible mode: no canvas, poster present', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('did-mode','accessible'));
  await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect(page.locator('.hero__poster')).toBeVisible();
});
test('premium + reduced-motion: poster, still no canvas (SC-1)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('did-mode','premium'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('premium + motion: canvas mounts, decorative, axe clean', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('did-mode','premium'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('aria-hidden','true'); // or on wrapper — assert not tabbable
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a','wcag2aa','wcag2aaa','wcag21aa','wcag22aa']).analyze();
  expect(violations).toEqual([]);
});
```

**`tests/premium-dispose.spec.ts` (PREM-04):**
```ts
import { test, expect } from '@playwright/test';
test('nav away/back ×15 disposes cleanly — no WebGL context leak', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (/too many active webgl|context lost/i.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => localStorage.setItem('did-mode','premium'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  for (let i=0;i<15;i++){
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('link', { name: /about/i }).first().click(); // client-side nav
    await expect(page).toHaveURL(/\/about\/?$/);
    await expect(page.locator('canvas')).toHaveCount(0);            // unmounted + disposed
    await page.goBack();
  }
  expect(errors).toEqual([]);
});
test('forced context loss → poster fallback, no crash, content intact', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('did-mode','premium'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.evaluate(() => {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    (c.getContext('webgl2')||c.getContext('webgl'))?.getExtension('WEBGL_lose_context')?.loseContext();
  });
  await expect(page.locator('.hero__poster')).toBeVisible(); // poster still there / fallback
  await expect(page.locator('h1')).toBeVisible();            // content never lost
});
```

### Sampling Rate
- **Per task commit:** `pnpm exec playwright test tests/premium-hero.spec.ts && node scripts/check-premium-split.mjs`
- **Per wave merge:** `pnpm exec playwright test tests/premium-*.spec.ts`
- **Phase gate:** full `pnpm test` (add `test:split`) green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `scripts/check-premium-split.mjs` — PREM-02 build proof; wire `test:split` into `test` after `build`
- [ ] `tests/premium-bundle.spec.ts` — PREM-02 runtime network
- [ ] `tests/premium-hero.spec.ts` — PREM-01/03 canvas presence + decorative axe
- [ ] `tests/premium-dispose.spec.ts` — PREM-04 leak + context-loss
- [ ] Install `three@0.185.1 @threlte/core@8.5.16` + `-D @types/three@0.185.0` before any scene work
- [ ] `src/lib/a11y/prefers.svelte.ts` — reactive reduced-motion + WebGL detect (shared fixture for the gating logic)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Threlte 7 (Svelte 4 stores/slots) | Threlte 8 (Svelte 5 runes, snippets, `useTask`) | Threlte 8 major | Use `useTask`/`useThrelte`, `$state`/`$derived`, snippet children — not Svelte-4 idioms |
| One `<Canvas>` per route (context churn) | Single canvas mounted only where needed (here: Home only) | community consensus | No multi-context exhaustion because there is exactly one, on one route |
| `renderMode="always"` | `renderMode="on-demand"` (Threlte default) + task-gated invalidation | Threlte 8 default | Free pause when idle/offscreen; big battery/perf win |

**Deprecated/outdated:** `@react-three/*` patterns, Threlte 7 slot-based children, and any Svelte-4 `export let` in scene components.

## Open Questions

1. **Exact Threlte auto-disposal of `<T>`-declared vs imperatively-created objects.**
   - Known: `<Canvas>` owns its renderer; `<T>` disposes geometry/material on unmount (`dispose` default on).
   - Unclear: the dedicated disposal doc page 404'd on 2026-07-05, so the precise auto-dispose surface isn't re-verified from docs.
   - Recommendation: declare geometries/materials via `<T>` where practical AND add the explicit `renderer.dispose()`/`forceContextLoss()` + manual `.dispose()` teardown in `onDestroy`. The dispose test is the real gate — trust the console-error assertion over the docs.

2. **Whether `<Canvas>` transparency needs a manual `alpha` renderer flag to let CSS `--bg` show through.**
   - Recommendation: prefer a transparent canvas + CSS `--bg` behind it (avoids a hardcoded hex in JS, which would also trip the raw-hex gate). Verify visually that the poster/token bg reads through; if not, set clear alpha to 0 in `createRenderer`. Low risk.

## Sources

### Primary (HIGH confidence)
- threlte.xyz — `<Canvas>` reference (`renderMode` default `on-demand`; `dpr` accepts `[min,max]`; `autoRender`, `toneMapping` defaults) — https://threlte.xyz/docs/reference/core/canvas
- threlte.xyz — `useTask` reference (signature, `running`/`autoInvalidate`, auto-invalidate → re-render; `useThrelte` exposes `invalidate`, renderer) — https://threlte.xyz/docs/reference/core/use-task
- npm registry — three 0.185.1, @threlte/core 8.5.16, @threlte/extras 9.21.0, @types/three 0.185.0 (re-verified 2026-07-05)
- Playwright docs — `reducedMotion` default `no-preference`, `emulateMedia` — https://playwright.dev/docs/api/class-testoptions
- Project research already in repo: `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` (lazy boundary, single-canvas, dispose, base path)

### Secondary (MEDIUM confidence)
- MDN — `WEBGL_lose_context.loseContext()` (used to test context loss) — https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context/loseContext
- Khronos WebGL wiki — HandlingContextLost (preventDefault on `webglcontextlost`, restore flow) — https://wikis.khronos.org/webgl/HandlingContextLost
- three.js forum/issues — WebGLRenderer context-lost + memory-leak discussions — https://discourse.threejs.org/t/how-to-fix-three-webglrenderer-context-lost/66395 , https://github.com/mrdoob/three.js/issues/18759

### Tertiary (LOW confidence / needs runtime validation)
- Threlte auto-disposal precise surface — dedicated doc page returned 404 on 2026-07-05; mitigated by explicit teardown + the dispose test as the real gate.

## Metadata

**Confidence breakdown:**
- Lazy-import boundary + build-grep proof: HIGH — documented Vite/SvelteKit code-splitting; boundary is greppable and test-enforced.
- Threlte 8 Canvas/useTask API: HIGH — verified against threlte.xyz reference pages.
- Scene design: MEDIUM-HIGH — standard three/Threlte primitives; procedural, echoes the existing poster; aesthetic is opinion-driven but grounded in the Phase-2 token palette.
- Disposal internals: MEDIUM — auto-dispose doc unavailable; explicit teardown + console-error test compensate.
- Reduced-motion/WebGL/context-loss fallback: HIGH — matchMedia + feature-detect + `{:catch}` + `webglcontextlost` are standard, and the poster fallback already exists.

**Research date:** 2026-07-05
**Valid until:** ~2026-08-05 (Threlte/three move at a moderate pace; re-verify versions and the Canvas/useTask API if picked up later)

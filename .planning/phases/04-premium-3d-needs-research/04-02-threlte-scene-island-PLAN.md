---
phase: 04-premium-3d-needs-research
plan: 02
type: execute
wave: 2
depends_on: ["04-01"]
files_modified:
  - src/lib/components/premium/PremiumHero.svelte
  - src/lib/components/premium/HeroScene.svelte
  - src/lib/components/premium/scene/Scene.svelte
  - src/lib/components/premium/scene/ParticleField.svelte
  - src/lib/components/premium/scene/EchoRings.svelte
  - src/lib/components/premium/scene/Lights.svelte
  - src/lib/components/Hero.svelte
autonomous: true
requirements: [PREM-01, PREM-04]

must_haves:
  truths:
    - "In Premium mode with motion allowed and WebGL present, one decorative aria-hidden <canvas> mounts over the poster and drifts gently"
    - "Every non-render path (Accessible, reduced-motion, no-WebGL, import failure, context-lost) shows the existing static poster with zero content loss"
    - "three/@threlte are imported ONLY inside src/lib/components/premium/**; PremiumHero.svelte and Hero.svelte stay three-free"
    - "On unmount the renderer is explicitly disposed + forceContextLoss()'d and the webglcontextlost listener is removed (no context accumulation)"
    - "The useTask drift loop pauses when the tab is hidden or the hero scrolls offscreen (on-demand render, 0 GPU when idle)"
  artifacts:
    - path: "src/lib/components/premium/PremiumHero.svelte"
      provides: "three-FREE boundary: gates on mode+reduced-motion+WebGL, {#await import('./HeroScene.svelte')}, {:catch}+context-lost -> poster"
      contains: "import('./HeroScene.svelte')"
    - path: "src/lib/components/premium/HeroScene.svelte"
      provides: "the ONLY three/@threlte importer: <Canvas renderMode on-demand dpr [1,1.5]>, onDestroy disposal, webglcontextlost listener"
      contains: "renderer.dispose"
    - path: "src/lib/components/premium/scene/Scene.svelte"
      provides: "camera + lights + children + useTask drift loop gated on visibility/onscreen"
      contains: "useTask"
    - path: "src/lib/components/Hero.svelte"
      provides: "static three-free import + <PremiumHero/> overlay above the untouched poster/content"
      contains: "PremiumHero"
  key_links:
    - from: "src/lib/components/Hero.svelte"
      to: "src/lib/components/premium/PremiumHero.svelte"
      via: "static import (three-free boundary)"
      pattern: "import PremiumHero"
    - from: "src/lib/components/premium/PremiumHero.svelte"
      to: "src/lib/components/premium/HeroScene.svelte"
      via: "dynamic import() code-split point"
      pattern: "import\\('./HeroScene.svelte'\\)"
    - from: "src/lib/components/premium/HeroScene.svelte"
      to: "WebGLRenderer teardown"
      via: "onDestroy dispose + forceContextLoss"
      pattern: "forceContextLoss"
---

<objective>
Build the single decorative Threlte hero island and wire it into Hero.svelte behind the
three-free dynamic-import boundary, so Premium+motion+WebGL renders a restrained luminous-depth
scene (PREM-01) that disposes cleanly and retreats to the poster on any failure (PREM-04) — while
the Accessible graph stays 100% WebGL-free.

Purpose: This is the actual enhancement. It must honor the hard quarantine rule (three/@threlte
ONLY under premium/, reached ONLY via import()) or PREM-02 fails in 04-03.
Output: premium/PremiumHero.svelte (boundary), premium/HeroScene.svelte (canvas + teardown),
premium/scene/* (Scene, ParticleField, EchoRings, Lights), and the Hero.svelte overlay.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/04-premium-3d-needs-research/04-RESEARCH.md
@.planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md
@src/lib/components/Hero.svelte
@src/lib/stores/mode.svelte.ts

<interfaces>
<!-- Contracts from 04-01 + existing code. Use directly. -->

From 04-01 — src/lib/a11y/prefers.svelte.ts:
```ts
export const prefersReducedMotion; // .current: boolean (reactive)
export function webglSupported(): boolean;
```

Mode store — src/lib/stores/mode.svelte.ts:
```ts
export const mode; // mode.current: 'accessible' | 'premium'
```

Threlte 8 API (verified against threlte.xyz — Svelte 5 runes, NOT Threlte 7 slots):
```ts
import { Canvas, T, useTask, useThrelte } from '@threlte/core';
// <Canvas renderMode="on-demand" dpr={[1, 1.5]}> ... </Canvas>
// useTask((delta) => {...}, { running: () => boolean });  // running=false pauses on-demand render
// const { renderer } = useThrelte();  // renderer.domElement, renderer.dispose(), renderer.forceContextLoss()
// <T.PerspectiveCamera makeDefault position={[0,0,6]} />, <T.PointLight color="#..." />, <T.InstancedMesh> etc.
```

Premium token colors (from 02-UI-SPEC.md — [data-mode="premium"]):
  --primary (blue glow) = #6FB4FF ; --accent (orange glow) = #FF9E5E ; --bg = #0A0E14
  Scene lights use blue upper-right + orange lower-left. Prefer a TRANSPARENT canvas so the CSS
  --bg shows through (no hardcoded clear-color hex in JS). Hex constants for three.Color are
  allowed ONLY inside premium/ (raw-hex gate now exempts that folder — done in 04-01).

Existing Hero.svelte (DO NOT touch the poster SVG, headline, subhead, or CTA — only add the
overlay). It already carries the PHASE-4 SEAM comment marking where the island mounts.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Three-free boundary (PremiumHero) + Canvas host with disposal/context-loss (HeroScene)</name>
  <read_first>
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Lazy-Import Boundary — verbatim PremiumHero + HeroScene; §Disposal & Failure Handling; §Reduced-Motion...Context-loss)
    - src/lib/a11y/prefers.svelte.ts (from 04-01 — gating inputs)
    - src/lib/stores/mode.svelte.ts
  </read_first>
  <files>src/lib/components/premium/PremiumHero.svelte, src/lib/components/premium/HeroScene.svelte</files>
  <action>
    A) src/lib/components/premium/PremiumHero.svelte — the boundary. Imports NOTHING from
    three/@threlte. Gates on Premium AND motion-allowed AND WebGL, dynamically imports the scene,
    and collapses to the poster on pending / import-failure / context-loss. Use a shared rune for
    contextLost so a lost canvas retreats to the poster:
    ```svelte
    <script lang="ts">
      import { mode } from '$lib/stores/mode.svelte';
      import { prefersReducedMotion, webglSupported } from '$lib/a11y/prefers.svelte';

      // Runtime context-loss flag, raised by HeroScene's webglcontextlost listener via the callback.
      let contextLost = $state(false);

      // Show the 3D scene ONLY when: Premium mode AND motion allowed AND WebGL present AND context alive.
      // Any false -> render nothing here; the poster underneath (in Hero.svelte) is the fallback.
      const show3D = $derived(
        mode.current === 'premium' &&
          !prefersReducedMotion.current &&
          webglSupported() &&
          !contextLost
      );
    </script>

    {#if show3D}
      {#await import('./HeroScene.svelte')}
        <!-- pending: render nothing; poster shows through -->
      {:then { default: HeroScene }}
        <HeroScene onContextLost={() => (contextLost = true)} />
      {:catch}
        <!-- import/runtime failure: render nothing; poster shows through (no content loss) -->
      {/await}
    {/if}
    ```
    (Do NOT statically import HeroScene — the string `import('./HeroScene.svelte')` is the ONLY
    reference to it anywhere, which is what makes Vite code-split the whole three graph.)

    B) src/lib/components/premium/HeroScene.svelte — the ONLY file that imports @threlte/core.
    Hosts the single <Canvas> (on-demand, DPR-capped), owns explicit teardown + context-loss
    retreat. Accepts an onContextLost callback prop; forwards it into Scene:
    ```svelte
    <script lang="ts">
      import { Canvas } from '@threlte/core';
      import Scene from './scene/Scene.svelte';

      let { onContextLost }: { onContextLost?: () => void } = $props();
    </script>

    <div class="scene" aria-hidden="true">
      <Canvas renderMode="on-demand" dpr={[1, 1.5]}>
        <Scene {onContextLost} />
      </Canvas>
    </div>

    <style>
      .scene {
        position: absolute;
        inset: 0;
        pointer-events: none; /* decorative — no pointer/AT capture, never in tab order */
      }
      .scene :global(canvas) {
        width: 100%;
        height: 100%;
      }
    </style>
    ```
    The renderer.dispose()/forceContextLoss() + webglcontextlost wiring lives inside Scene.svelte
    (Task 2) because useThrelte() must run within the <Canvas> context.
  </action>
  <acceptance_criteria>
    - `test -f src/lib/components/premium/PremiumHero.svelte && test -f src/lib/components/premium/HeroScene.svelte`
    - `! grep -Eq "three|@threlte" src/lib/components/premium/PremiumHero.svelte` (boundary is three-FREE)
    - `grep -q "import('./HeroScene.svelte')" src/lib/components/premium/PremiumHero.svelte` matches
    - `grep -q "@threlte/core" src/lib/components/premium/HeroScene.svelte` matches
    - `grep -q 'aria-hidden="true"' src/lib/components/premium/HeroScene.svelte` matches
    - `grep -q 'renderMode="on-demand"' src/lib/components/premium/HeroScene.svelte` matches
    - `grep -q "pointer-events: none" src/lib/components/premium/HeroScene.svelte` matches
    - `pnpm check` exits 0
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>PremiumHero is a three-free gate that dynamically imports the scene and falls back to the poster on every non-render path; HeroScene hosts one aria-hidden, pointer-events:none, on-demand, DPR-capped Canvas.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Procedural scene — camera + drift loop, particles, echo rings, lights, teardown</name>
  <behavior>
    - Premium+motion: Scene mounts a PerspectiveCamera, 2 point lights (blue/orange) + dim ambient, ~300 instanced particles, 2-3 wireframe rings; all drift slowly via useTask.
    - useTask `running` is FALSE when document.hidden OR the canvas is offscreen (IntersectionObserver) -> on-demand render halts.
    - onDestroy calls renderer.dispose() + renderer.forceContextLoss() and removes the webglcontextlost listener; nav-away x15 raises no "Too many active WebGL contexts".
    - webglcontextlost -> preventDefault() + invoke onContextLost (parent retreats to poster).
  </behavior>
  <read_first>
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Scene Design — component structure + motion loop; §Disposal & Failure Handling — verbatim teardown)
    - .planning/phases/02-mode-system-design-tokens/02-UI-SPEC.md (§3 premium colors #6FB4FF / #FF9E5E / #0A0E14, --glow)
  </read_first>
  <files>src/lib/components/premium/scene/Scene.svelte, src/lib/components/premium/scene/ParticleField.svelte, src/lib/components/premium/scene/EchoRings.svelte, src/lib/components/premium/scene/Lights.svelte</files>
  <action>
    Build the four scene files under premium/scene/. This is a NON-interactive ambient drift —
    NO OrbitControls (focus-trap risk), no textures, no GLTF (procedural = cannot 404, lean chunk).

    A) Scene.svelte — owns the camera, the useTask drift loop, the running gate (visibility +
    IntersectionObserver), and the explicit teardown + context-loss listener. Accepts onContextLost:
    ```svelte
    <script lang="ts">
      import { onDestroy } from 'svelte';
      import { T, useTask, useThrelte } from '@threlte/core';
      import Lights from './Lights.svelte';
      import ParticleField from './ParticleField.svelte';
      import EchoRings from './EchoRings.svelte';

      let { onContextLost }: { onContextLost?: () => void } = $props();

      const { renderer, invalidate } = useThrelte();
      const canvas = renderer.domElement;

      // running gate: only advance/render when the tab is visible AND the hero is onscreen.
      let visible = $state(typeof document === 'undefined' ? true : !document.hidden);
      let onscreen = $state(true);
      const running = () => visible && onscreen;

      const onVis = () => (visible = !document.hidden);
      document.addEventListener('visibilitychange', onVis);

      const io = new IntersectionObserver(([e]) => (onscreen = e.isIntersecting), { threshold: 0 });
      io.observe(canvas);

      const onLost = (e: Event) => {
        e.preventDefault(); // keep the context recoverable; we retreat to the poster instead
        onContextLost?.();
      };
      canvas.addEventListener('webglcontextlost', onLost, false);

      // Shared drift clock; children read elapsed. Tiny amplitude = restrained, non-vestibular.
      let elapsed = $state(0);
      useTask(
        (delta) => {
          elapsed += delta;
          invalidate(); // drive the on-demand renderer while running
        },
        { running }
      );

      onDestroy(() => {
        document.removeEventListener('visibilitychange', onVis);
        canvas.removeEventListener('webglcontextlost', onLost);
        io.disconnect();
        try {
          renderer.dispose(); // free renderer-held GL resources + programs
          renderer.forceContextLoss(); // release the GL context immediately (vs the ~8-16 cap)
        } catch {
          /* already gone */
        }
      });
    </script>

    <T.PerspectiveCamera makeDefault position={[0, 0, 6]} fov={50} />
    <Lights />
    <ParticleField {elapsed} />
    <EchoRings {elapsed} />
    ```

    B) Lights.svelte — blue upper-right + orange lower-left point lights + dim ambient. Colors are
    the premium tokens; hex constants are allowed here (premium/ is exempt from the raw-hex gate):
    ```svelte
    <script lang="ts">
      import { T } from '@threlte/core';
      const BLUE = '#6FB4FF';   // --primary (premium)
      const ORANGE = '#FF9E5E'; // --accent (premium)
    </script>

    <T.AmbientLight intensity={0.35} />
    <T.PointLight color={BLUE} intensity={26} position={[3, 2.5, 3]} distance={20} />
    <T.PointLight color={ORANGE} intensity={20} position={[-3, -2, 2]} distance={20} />
    ```

    C) ParticleField.svelte — ONE THREE.InstancedMesh (~300 instances, one draw call), denser near
    the upper-right focal point, drifting from the shared `elapsed`. Build the instance matrices
    once in a $effect/onMount and update a gentle per-frame offset. Keep amplitude tiny:
    ```svelte
    <script lang="ts">
      import { T } from '@threlte/core';
      import { InstancedMesh, Object3D, SphereGeometry, MeshStandardMaterial, Color } from 'three';

      let { elapsed = 0 }: { elapsed?: number } = $props();

      const COUNT = 300;
      const geo = new SphereGeometry(0.03, 8, 8);
      const mat = new MeshStandardMaterial({
        color: new Color('#8FC4FF'),
        emissive: new Color('#6FB4FF'),
        emissiveIntensity: 0.9
      });
      const mesh = new InstancedMesh(geo, mat, COUNT);
      const dummy = new Object3D();
      // seed positions: biased toward the upper-right focal point (poster motif)
      const seeds = Array.from({ length: COUNT }, () => ({
        x: 1.2 + (Math.random() - 0.5) * 6,
        y: 0.8 + (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 3,
        p: Math.random() * Math.PI * 2
      }));

      $effect(() => {
        for (let i = 0; i < COUNT; i++) {
          const s = seeds[i];
          dummy.position.set(
            s.x + Math.sin(elapsed * 0.2 + s.p) * 0.08,
            s.y + Math.cos(elapsed * 0.18 + s.p) * 0.08,
            s.z
          );
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });
    </script>

    <T is={mesh} />
    ```
    (Because geometry/material/mesh are created imperatively, they are owned here; Threlte disposes
    <T is={mesh}> on unmount, and the renderer teardown in Scene covers the GL context. If a linter
    prefers, also geo.dispose()/mat.dispose() in an onDestroy — optional belt-and-suspenders.)

    D) EchoRings.svelte — 2-3 wireframe rings/tori at varying z, rotating slowly from `elapsed` —
    the moving version of the poster's concentric arcs:
    ```svelte
    <script lang="ts">
      import { T } from '@threlte/core';
      import { TorusGeometry, MeshBasicMaterial, Color } from 'three';

      let { elapsed = 0 }: { elapsed?: number } = $props();
      const mat = new MeshBasicMaterial({ color: new Color('#6FB4FF'), wireframe: true, transparent: true, opacity: 0.35 });
      const rings = [
        { r: 1.6, z: -0.5, speed: 0.05 },
        { r: 2.4, z: -1.2, speed: -0.035 },
        { r: 3.2, z: -2.0, speed: 0.02 }
      ];
    </script>

    {#each rings as ring, i}
      <T.Mesh position={[1.2, 0.8, ring.z]} rotation.z={elapsed * ring.speed} rotation.x={0.6}>
        <T.TorusGeometry args={[ring.r, 0.012, 8, 96]} />
        <T is={mat} />
      </T.Mesh>
    {/each}
    ```

    Keep ALL of these under premium/scene/ — nothing here may be imported by any Accessible-graph
    module. Prefer a transparent canvas (do not setClearColor a hex) so the CSS --bg shows through.
  </action>
  <acceptance_criteria>
    - `test -f src/lib/components/premium/scene/Scene.svelte && test -f src/lib/components/premium/scene/ParticleField.svelte && test -f src/lib/components/premium/scene/EchoRings.svelte && test -f src/lib/components/premium/scene/Lights.svelte`
    - `grep -q "useTask" src/lib/components/premium/scene/Scene.svelte` matches
    - `grep -q "forceContextLoss" src/lib/components/premium/scene/Scene.svelte` matches
    - `grep -q "webglcontextlost" src/lib/components/premium/scene/Scene.svelte` matches
    - `grep -q "IntersectionObserver" src/lib/components/premium/scene/Scene.svelte` matches
    - `grep -q "visibilitychange" src/lib/components/premium/scene/Scene.svelte` matches
    - `grep -q "InstancedMesh" src/lib/components/premium/scene/ParticleField.svelte` matches
    - `pnpm check` exits 0
    - `pnpm test:tokens` still exits 0 (premium hex constants are exempt; nothing leaked into accessible files)
  </acceptance_criteria>
  <verify>
    <automated>pnpm check</automated>
  </verify>
  <done>A procedural drift scene (instanced particles + wireframe echo rings + blue/orange lights) runs via useTask, pauses when hidden/offscreen, and tears down its renderer + listeners on unmount; token gate stays green.</done>
</task>

<task type="auto">
  <name>Task 3: Wire the island into Hero.svelte over the untouched poster</name>
  <read_first>
    - src/lib/components/Hero.svelte (the PHASE-4 SEAM comment marks the insertion point)
    - .planning/phases/04-premium-3d-needs-research/04-RESEARCH.md (§Lazy-Import Boundary — the Hero.svelte seam snippet)
  </read_first>
  <files>src/lib/components/Hero.svelte</files>
  <action>
    Add the static (three-FREE) import of PremiumHero and render it absolutely positioned over
    .hero__poster. Do NOT alter the poster SVG, the h1/subhead/CTA, or existing styles — only add
    the import line and the single <PremiumHero /> element inside .hero, after the poster SVG and
    before .hero__content:
    ```svelte
    <script lang="ts">
      import { site } from '$lib/content/site';
      import { resolve } from '$app/paths';
      import PremiumHero from '$lib/components/premium/PremiumHero.svelte'; // three-FREE boundary — safe static import
    </script>

    <section class="hero">
      <svg class="hero__poster" ...>...</svg>   <!-- unchanged: permanent fallback -->
      <PremiumHero />                            <!-- overlays poster only when it mounts a canvas -->
      <div class="hero__content"> ...unchanged... </div>
    </section>
    ```
    PremiumHero's own root already positions absolutely (its child .scene is inset:0); the poster
    (position:absolute inset:0) and content (position:relative, above) already stack correctly —
    the canvas layers between them, behind the text. Do NOT import three/@threlte here.
  </action>
  <acceptance_criteria>
    - `grep -q "import PremiumHero from '\$lib/components/premium/PremiumHero.svelte'" src/lib/components/Hero.svelte` matches
    - `grep -q "<PremiumHero" src/lib/components/Hero.svelte` matches
    - `! grep -Eq "three|@threlte" src/lib/components/Hero.svelte` (Accessible graph stays WebGL-free)
    - `grep -q "hero__poster" src/lib/components/Hero.svelte` still matches (poster untouched)
    - `grep -q "site.home.heroHeadline" src/lib/components/Hero.svelte` still matches (content untouched)
    - `pnpm check` exits 0
    - `pnpm build` completes (prerender succeeds — Canvas only mounts client-side post-import)
  </acceptance_criteria>
  <verify>
    <automated>pnpm build</automated>
  </verify>
  <done>Hero.svelte statically imports the three-free PremiumHero and overlays it on the poster; poster/headline/subhead/CTA are byte-unchanged; build/prerender succeeds with no WebGL in the shared graph.</done>
</task>

</tasks>

<verification>
- pnpm check + pnpm build green.
- three/@threlte appear ONLY under src/lib/components/premium/ (grep).
- Hero.svelte + PremiumHero.svelte are three-free.
- Scene teardown (dispose + forceContextLoss + listener/IO cleanup) present.
</verification>

<success_criteria>
- Premium+motion+WebGL mounts one aria-hidden, pointer-events:none <canvas> with a restrained drift scene (PREM-01).
- Every fallback path lands on the existing poster (PREM-01/03/04) — poster + content never removed.
- Quarantine intact: three/@threlte only under premium/, reached only via import('./HeroScene.svelte').
- Explicit disposal + context-loss retreat wired (PREM-04).
- useTask pauses when hidden/offscreen.
</success_criteria>

<output>
After completion, create `.planning/phases/04-premium-3d-needs-research/04-02-SUMMARY.md`.
</output>

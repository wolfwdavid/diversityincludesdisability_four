# Feature Research

**Domain:** Disability-equity consultant / nonprofit / personal-brand advocacy website (static, dual-mode: Premium 3D ⇄ Accessible)
**Researched:** 2026-07-04
**Confidence:** HIGH (accessibility patterns verified against WCAG 2.2 + scope.org.uk live statement; 3D/static-form patterns MEDIUM — WebSearch-verified against multiple sources)

## Orienting Principle

This is a disability-equity org's *own* site. Accessibility is not a compliance checkbox — it is the **product demo**. Every a11y feature below is simultaneously a table-stakes obligation and a credibility signal. The Accessible mode is the reference render; Premium 3D is the opt-in enhancement. When the two conflict, Accessible wins.

Critical framing from research: scope.org.uk (the stated gold standard) deliberately **does not ship an accessibility-overlay widget**. It builds accessibility into the base markup and points users to OS/browser tools (AbilityNet "My Computer, My Way", W3C WAI guides) for personalization. Our dual-mode toggle is defensible *only because it is a genuine alternate render, not a bolt-on overlay*. See Anti-Features.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Baseline for any professional consultant/advocacy site — and the non-negotiable a11y floor for *this* org specifically.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Clear IA: Home, About Me, Services, Connect | Standard consultant site navigation; matches DID content | LOW | 4-5 routes; hierarchical nav mirroring scope.org.uk's clarity |
| Home hero + mission statement | First-impression, states what DID does | LOW | Content-first; hero works in both modes |
| 4 service descriptions (Trainings/Facilitation, Consulting, Modeling, Speaking/Panels) | Core offering; faithful rebuild requirement | LOW | Card grid (Accessible) / spatial layout (Premium) |
| Founder credibility (Eman Rimawi bio/story) | Personal-brand advocacy sites sell trust in the person | LOW | About Me page + home teaser |
| "Let's Connect" CTA to `emanrimawi@gmail.com` | Primary conversion path; org currently uses mailto | LOW | See contact analysis below — mailto primary, form optional |
| Social links (Facebook, X/Twitter, LinkedIn, Instagram) | Advocacy reach; present on current site | LOW | Icon links with **visible accessible names**, `rel="me noopener"`, open-in-same-tab preferred |
| Visible **skip link(s)** — "Skip to main content" (+ nav) | WCAG 2.4.1 Bypass Blocks; scope ships 3 (main/search/nav) | LOW | Visually hidden until focused, then clearly visible. **Copy scope's pattern.** |
| Semantic landmarks (`header`/`nav`/`main`/`footer`, one `<h1>`/page) | Screen-reader navigation; WCAG 1.3.1 | LOW | SvelteKit layout; correct heading hierarchy |
| Keyboard-complete operation, no traps | WCAG 2.1.1 / 2.1.2; disqualifying if missing on THIS site | MEDIUM | Every interactive element reachable + operable; test with keyboard only |
| Visible focus indicator (`:focus-visible`) meeting WCAG 2.2 | 2.4.7 Focus Visible + 2.4.11 Focus Not Obscured (AA, new in 2.2) | LOW | High-contrast focus ring; ensure sticky header never fully hides focused element |
| Color contrast AA (4.5:1 text / 3:1 large & UI) | WCAG 1.4.3 / 1.4.11; Accessible mode targets AAA (7:1) | LOW | Design-token concern; verify with automated + manual check |
| `prefers-reduced-motion` respected | WCAG 2.3.3 (AAA) + baseline expectation | LOW | No essential info conveyed only via motion; kill non-essential animation |
| Responsive / mobile-first, reflow to 320px | WCAG 1.4.10 Reflow; mobile majority traffic | MEDIUM | No horizontal scroll at 320px CSS width |
| Accessible page `<title>`s + logical tab order | 2.4.2 / 2.4.3 | LOW | Per-route titles |
| Fast static load (Accessible payload ships zero WebGL) | Low-bandwidth/older-device users common in disability community | MEDIUM | Code-split Three.js/Threlte behind Premium mode |
| Target size ≥ 24×24px for controls | WCAG 2.5.8 Target Size (Minimum) — **new in 2.2, AA** | LOW | Especially the mode toggle, nav, social icons |
| Consistent help placement (contact repeated same spot) | WCAG 3.2.6 Consistent Help — **new in 2.2, A** | LOW | "Connect" reachable consistently across pages (footer + nav) |
| Accessibility statement page | Legal/ethical norm; scope has a detailed one, updated 6-monthly | LOW | State conformance target, known issues, feedback contact. **Doubly expected for a disability org.** |

### Differentiators (Competitive Advantage)

Where this site stands apart — the dual-mode concept and exemplary, *demonstrated* accessibility.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Persistent Premium 3D ⇄ Accessible mode toggle** | The signature idea: "experience DID in the mode that works for your body/brain" — on-theme for disability equity | HIGH | Persist choice (localStorage) + honor OS signal as default. Toggle is a `button` with `aria-pressed`, not an overlay. |
| **OS-signal auto-selection** (`prefers-reduced-motion` / `prefers-contrast`) picks Accessible by default | Respects the user's existing declared needs without asking — inclusive by default | MEDIUM | Logical-OR: OS signal *or* stored choice → Accessible. Stored explicit choice can override upward to Premium. |
| **Live-region announcement on mode switch** | Screen-reader users hear the mode changed (name/role/value discipline) | MEDIUM | `aria-live="polite"` status node announces "Accessible mode on / Premium 3D mode on". Do NOT rely on button-label change alone (SRs announce it inconsistently). |
| **Accessible mode as a first-class render, not a degraded fallback** | Reframes accessibility as premium, not compromise — the org's entire thesis | MEDIUM | Flat, high-contrast, larger type, generous spacing, zero motion, zero WebGL. AAA contrast where feasible. |
| **In-page text-size + contrast controls** (optional) | Convenience for users who don't know OS tools exist | MEDIUM | **Judgment call.** Scope deliberately omits these and points to OS tools. If built, they must be real CSS-driven controls (font-size scaling, contrast theme), persist, and never be an overlay widget. Lower priority than nailing base a11y. |
| **Tasteful Premium 3D hero** (Threlte/Three.js) | Modern "premium" feel that proves accessibility ≠ boring; recruiting/brand signal | HIGH | See 3D guidance below. Lazy-loaded, pausable, poster fallback, reduced-motion-aware, keyboard-safe. |
| **Reduced-motion-aware 3D** (static poster + optional gentle motion) | Vestibular-safe premium experience | MEDIUM | If `prefers-reduced-motion: reduce`, render a static frame / drastically damped motion even in Premium mode. |
| **Visible, styled skip links (scope-grade)** | Most sites hide/neglect these; doing them visibly signals craft | LOW | Copy scope's 3-link pattern (main content, nav, and search if search exists — we likely have no search, so main + nav). |
| **Transparent accessibility statement with known-issues log** | Honesty builds trust; matches scope's practice | LOW | Conformance target (WCAG 2.2 AA, AAA-aiming), feedback path, review cadence. |

### Anti-Features (Commonly Requested, Often Problematic)

For a disability-equity org, several of these are not just risky — they are reputationally disqualifying.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Accessibility-overlay widget** (AudioEye/UserWay-style floating "accessibility menu") | Looks like instant compliance | Widely condemned by the disability community; sued repeatedly; would be self-refuting on a disability-equity site. Scope pointedly does not use one. | Build accessibility into base markup; genuine dual-mode render; point to OS tools |
| **Autoplaying motion / video with sound** | "Feels alive," premium | WCAG 2.2.2 violation; vestibular triggers; distracts AT users; hostile to the org's own audience | Motion is opt-in (Premium mode), pausable, reduced-motion-aware, no audio |
| **Parallax scrolling / scroll-jacking** | Trendy "premium" effect | Induces vestibular/nausea issues; breaks scroll expectations; a11y hostile | Subtle, non-essential, disabled under reduced-motion; never scroll-jack |
| **3D that traps keyboard focus** | Immersive canvas interaction | Canvas focus traps strand keyboard/SR users (WCAG 2.1.2) | Canvas is decorative (`aria-hidden` / `role="img"` + alt), not in tab order; all content lives in DOM |
| **Low-contrast "trendy" design** (thin gray text, gray-on-white) | Aesthetic minimalism | Fails 1.4.3; alienates low-vision users — the org's constituency | High-contrast tokens; brand blue/orange tuned to pass AA/AAA |
| **Content that only exists inside the 3D layer** | Showpiece uniqueness | Invisible to SRs, keyboard, Accessible mode; content drift between modes | Single content source rendered by both modes; 3D is presentation only |
| **mailto as the *only* structured contact, unlabeled** | Zero backend, simplest | Fails silently if no mail client configured; no confirmation | Prominent labeled mailto CTA + (optional) form backend with accessible validation |
| **CAPTCHA on contact** | Spam fear | Cognitive-function barrier; brushes WCAG 3.3.8 intent; friction for disabled users | Honeypot / privacy-respecting challenge (Altcha) only if spam proves real |
| **Login / account / CMS / donation-podcast integrations** | Feature-completeness | Out of scope per PROJECT.md; adds auth + PII + backend to a static site | Static content only; defer to a later milestone (tracked in Rimawi RESUME.md) |
| **Infinite scroll / hidden nav / hamburger-only desktop nav** | Minimal chrome | Hurts orientation and keyboard discovery | Persistent visible nav; consistent help (3.2.6) |
| **Committing any PII/EIN/credentials from the Notion source** | Convenience | Security/privacy breach; some remotes are public | Public content only; never commit raw source |

---

## scope.org.uk Patterns Worth Copying (Concrete Checklist)

Verified against scope.org.uk's live accessibility statement (last updated Nov 2025) and their published accessibility guidelines/principles:

1. **Three skip links** at the very top: "Skip to main content", "Skip to navigation" (scope also has "Skip to search" — omit unless we add search). Visually hidden until focused, then clearly visible.
2. **Stated conformance target above the floor**: scope aims for **WCAG 2.2 AAA** (not just AA) and says so publicly. We mirror: "WCAG 2.2 AA floor, AAA where feasible in Accessible mode."
3. **Dedicated, detailed accessibility statement** with (a) conformance target, (b) a transparent **known-issues list**, (c) a **feedback mechanism** (how to report a barrier), and (d) a **review cadence** ("tested every 6 months").
4. **Multiple, consistently placed contact methods** — not a single buried form.
5. **Strong, unmistakable focus states** on all interactive elements (GOV.UK-style thick, high-contrast focus indicators are the reference implementation scope's ecosystem uses).
6. **Clear hierarchical navigation and heading structure** — orientation over cleverness.
7. **Accessibility built into the base site, no overlay widget** — personalization is delegated to OS/browser tools (they link AbilityNet "My Computer, My Way" + W3C WAI). This validates our "genuine alternate render, not a bolt-on" architecture.

---

## Feature Dependencies

```
Mode toggle (Premium ⇄ Accessible)
    └──requires──> Two render paths from one content source
                       └──requires──> Content modeled independent of presentation (single source of truth)
    └──requires──> Persistence layer (localStorage) + hydration-safe default
    └──requires──> OS-signal detection (prefers-reduced-motion / prefers-contrast)
    └──requires──> Live-region status node (announce switch)

Premium 3D hero
    └──requires──> Lazy-loaded / code-split Threlte+Three.js bundle
    └──requires──> Reduced-motion branch (static poster fallback)
    └──requires──> Canvas removed from tab order + DOM-based content mirror
    └──enhanced-by──> WebGPU renderer (Safari 26+ now supports; feature-detect, fallback to WebGL)

Accessible mode (first-class)
    └──requires──> High-contrast design tokens (AA/AAA)
    └──requires──> Skip links + landmarks + focus-visible (shared with base, always on)
    └──ships──> ZERO WebGL/Three.js (hard requirement)

Contact CTA
    └──requires──> Prominent labeled mailto (baseline, no backend)
    └──enhanced-by──> Optional third-party form backend (Formspree/Web3Forms/Static Forms) with accessible validation
```

### Dependency Notes

- **Mode toggle requires a single content source:** both renders must read the same content, or the modes drift and Accessible becomes a stale second-class citizen. This is the #1 architectural risk.
- **Premium 3D requires code-splitting:** if Three.js is in the base bundle, Accessible mode no longer "ships zero WebGL" and the performance promise breaks (PROJECT constraint).
- **Toggle enhances but must not gate content:** with JS off or a WebGL failure, the site must resolve to Accessible mode and remain fully usable (Core Value).
- **Reduced-motion conflicts with un-guarded 3D motion:** Premium mode must itself honor `prefers-reduced-motion`, not assume Premium == full motion.
- **Live-region announcement is required because label-swap is insufficient:** screen readers announce `aria-pressed`/name changes inconsistently; an explicit polite status message is the reliable path.

---

## MVP Definition

### Launch With (v1)

- [ ] IA + 4 routes (Home, About Me, Services, Connect) — faithful content rebuild
- [ ] All 4 service descriptions + founder credibility content
- [ ] Accessible mode as the base render: skip links, landmarks, `:focus-visible`, AA/AAA contrast, keyboard-complete, reduced-motion, target size ≥24px — **this must be flawless; it is the demo**
- [ ] Persistent mode toggle with `aria-pressed` + live-region announcement
- [ ] OS-signal auto-select (reduced-motion / contrast → Accessible default)
- [ ] Premium 3D hero, lazy-loaded, pausable, poster fallback, keyboard-safe, reduced-motion-aware
- [ ] Prominent labeled "Let's Connect" mailto CTA + social links with accessible names
- [ ] Accessibility statement page (conformance target, known issues, feedback path)
- [ ] Static build → GitHub Pages (base path, 404 fallback, `.nojekyll`)

### Add After Validation (v1.x)

- [ ] Optional third-party contact form (Formspree/Web3Forms) as progressive enhancement over mailto — trigger: users report mailto friction
- [ ] In-page text-size / contrast controls — trigger: analytics/feedback show users want them beyond OS tools
- [ ] WebGPU renderer path with WebGL fallback — trigger: measurable perf win on target devices
- [ ] Richer Premium 3D scenes on service pages — trigger: hero validates the concept

### Future Consideration (v2+)

- [ ] Donation / podcast integrations — deferred per PROJECT.md (tracked in Rimawi RESUME.md)
- [ ] Search (would add scope's 3rd skip link) — only if content volume grows
- [ ] Blog / news / stories section — defer until there's content cadence

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Flawless Accessible base render (skip links, focus, contrast, keyboard) | HIGH | MEDIUM | P1 |
| Content rebuild (mission, 4 services, bio) | HIGH | LOW | P1 |
| Persistent mode toggle + live-region announce | HIGH | HIGH | P1 |
| OS-signal auto-select | HIGH | MEDIUM | P1 |
| Labeled mailto "Let's Connect" + social links | HIGH | LOW | P1 |
| Accessibility statement page | MEDIUM | LOW | P1 |
| Static GH-Pages deploy config | HIGH | LOW | P1 |
| Premium 3D hero (tasteful, guarded) | MEDIUM | HIGH | P2 |
| Reduced-motion 3D branch / poster fallback | HIGH | MEDIUM | P2 |
| Optional third-party contact form | MEDIUM | MEDIUM | P2/P3 |
| In-page text/contrast controls | LOW-MED | MEDIUM | P3 |
| WebGPU renderer path | LOW | MEDIUM | P3 |

## Competitor / Reference Feature Analysis

| Feature | scope.org.uk (a11y gold standard) | Typical premium-3D agency site | Our Approach |
|---------|-----------------------------------|-------------------------------|--------------|
| Skip links | 3 (main/search/nav), visible on focus | Usually absent | Copy scope: main + nav, visible on focus |
| Personalization | Delegated to OS/browser tools; no overlay | Overlay widget (bad) | Genuine dual-mode render + point to OS tools; no overlay |
| Motion | Minimal, reduced-motion respected | Heavy autoplay/parallax | Motion is opt-in Premium, pausable, reduced-motion-aware |
| Contrast | AA/AAA-aiming, high-contrast base | Often thin low-contrast "trendy" | AA floor, AAA in Accessible mode |
| Conformance transparency | Public statement + known-issues + 6-mo review | None | Public statement with known-issues log |
| 3D / WebGL | None | Central, often focus-trapping | Lazy, decorative, keyboard-safe, zero-WebGL in Accessible mode |
| Contact | Multiple consistent methods | Fancy form, sometimes CAPTCHA-walled | Labeled mailto primary (+ optional accessible form), no CAPTCHA |

## Contact / CTA & Social — Static-Host Decision

- **Recommendation:** **Labeled mailto as the primary CTA** (`emanrimawi@gmail.com`), matching the org's current behavior and honest for a no-backend static site. Present it as visible text + a clearly-labeled link (not an unlabeled icon), so it works even without a configured mail client.
- **Optional enhancement:** a third-party form backend (Formspree, Web3Forms, or Static Forms) posts from the static page to their API — works on GitHub Pages with no server. Add only if mailto friction is reported. Any form must have: visible labels, programmatic error messaging (WCAG 3.3.1/3.3.3), no CAPTCHA (honeypot/Altcha if spam appears).
- **Anti-pattern:** mailto exposed as the *only* path with no fallback text, or a form gated behind reCAPTCHA (cognitive barrier, brushes 3.3.8 intent).
- **Social embedding:** use plain icon+text links with real accessible names (e.g., "Diversity Includes Disability on Instagram"), `rel="me noopener"`. **Do not** embed live social feed widgets (heavy JS, tracking, motion, a11y-poor). Static links only.

## Premium 3D — Keeping It Tasteful (Guidance)

- **Restraint over spectacle:** one purposeful hero moment, not 3D on every scroll. Subtle depth/lighting beats aggressive camera moves.
- **Performance budget:** target <100 draw calls / 60fps; Draco-compress geometry; dispose unused resources; keep the lazy chunk small. WebGPU is now available across major browsers (Safari 26, Sept 2025) — feature-detect and fall back to WebGL.
- **Motion safety:** honor `prefers-reduced-motion` inside Premium too — render a static poster frame or heavily damped motion; never parallax/scroll-jack.
- **Keyboard & SR safety:** the `<canvas>` is decorative — `aria-hidden` or `role="img"` with alt text; keep it out of the tab order; all real content lives in the DOM and is identical to Accessible mode.
- **Controls:** provide a visible pause/reduce-motion control for the hero animation (WCAG 2.2.2 for anything moving >5s).
- **Graceful failure:** WebGL context loss or slow device → fall back to the poster/Accessible presentation; the page never blanks.

## Sources

- scope.org.uk accessibility statement (live, updated Nov 2025) — skip links, WCAG 2.2 AAA aim, 6-month testing, known-issues + feedback, delegated personalization: https://www.scope.org.uk/accessibility and https://www.scope.org.uk/about-us/accessibility-at-scope — HIGH
- WCAG 2.2 (W3C Recommendation) — new SCs 2.4.11 Focus Not Obscured, 2.4.13 Focus Appearance, 2.5.8 Target Size (24px), 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication: https://www.w3.org/TR/WCAG22/ and https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ — HIGH
- GOV.UK Design System — skip link + focus-state reference patterns: https://design-system.service.gov.uk/components/skip-link/ , https://design-system.service.gov.uk/get-started/focus-states/ — HIGH
- ARIA live regions + accessible toggle buttons (name/role/value, label-swap unreliability): https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions , https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-2/ , https://testparty.ai/blog/accessible-toggle-buttons-modern-web-apps-complete-guide — MEDIUM
- prefers-reduced-motion / prefers-contrast + localStorage persistence pattern: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using_for_accessibility , https://a11y-blog.dev/en/articles/css-media-features-for-a11y/ — MEDIUM
- Three.js performance + accessibility (draw calls, Draco, react-three-a11y, reduced motion), WebGPU in Safari 26: https://www.utsubo.com/blog/threejs-best-practices-100-tips , https://medium.com/@piplev/three-js-accessibility-c4f45d83f2c6 — MEDIUM
- Static-site contact form landscape (mailto limits, Formspree/Netlify/Static Forms, GH Pages needs external backend): https://www.staticforms.dev/blog/formspree-vs-static-forms-comparison , https://un-static.com/guide/how-to-add-contact-form-static-website/ — MEDIUM

---
*Feature research for: disability-equity dual-mode advocacy site (Diversity Includes Disability)*
*Researched: 2026-07-04*

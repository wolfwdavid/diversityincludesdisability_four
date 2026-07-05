<script lang="ts">
	import { site } from '$lib/content/site';
	import { resolve } from '$app/paths';
	import PremiumHero from '$lib/components/premium/PremiumHero.svelte'; // WebGL-free boundary — safe static import
</script>

<!--
	Decorative abstract poster (PREM-03): aria-hidden; all hero meaning lives in the DOM
	text below, not the art. This static token-driven SVG is the PERMANENT Accessible-mode
	hero AND the Phase-4 fallback slot — zero WebGL, zero motion (A11Y-08).

	PHASE-4 SEAM: to add the lazy 3D hero, dynamically import a Premium hero island
	(e.g. `import('$lib/components/PremiumHero.svelte')`) gated on Premium mode and render
	it ABSOLUTELY POSITIONED over `.hero__poster` (which stays as the no-JS/reduced-motion
	fallback). Do NOT statically import three/@threlte here — that would pull WebGL into the
	Accessible bundle. The real headline/subhead/CTA below must remain untouched.
-->
<section class="hero">
	<!-- Luminous-depth motif: concentric arcs + intersecting rings, recolors per theme via tokens. -->
	<svg
		class="hero__poster"
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 800 400"
		preserveAspectRatio="xMidYMid slice"
	>
		<defs>
			<radialGradient id="hero-scrim" cx="72%" cy="34%" r="70%">
				<stop class="hero__scrim-in" offset="0%" />
				<stop class="hero__scrim-mid" offset="45%" />
				<stop class="hero__scrim-out" offset="100%" />
			</radialGradient>
		</defs>

		<!-- depth scrim -->
		<rect x="0" y="0" width="800" height="400" fill="url(#hero-scrim)" />

		<!-- concentric arcs radiating from the upper-right focal point -->
		<g class="hero__rings" fill="none">
			<circle cx="580" cy="140" r="70" opacity="0.9" />
			<circle cx="580" cy="140" r="128" opacity="0.6" />
			<circle cx="580" cy="140" r="196" opacity="0.38" />
			<circle cx="580" cy="140" r="272" opacity="0.22" />
			<circle cx="580" cy="140" r="356" opacity="0.12" />
		</g>

		<!-- intersecting accent rings — the "inclusion / overlap" gesture -->
		<g class="hero__accent" fill="none">
			<circle cx="250" cy="300" r="150" opacity="0.5" />
			<circle cx="380" cy="250" r="112" opacity="0.38" />
		</g>

		<!-- small luminous nodes -->
		<g class="hero__nodes">
			<circle cx="580" cy="140" r="7" />
			<circle cx="250" cy="300" r="5" opacity="0.8" />
			<circle cx="380" cy="250" r="5" opacity="0.8" />
		</g>
	</svg>

	<!-- Premium 3D island: overlays the poster ONLY when it mounts a canvas (Premium+motion+WebGL);
	     every fallback path renders nothing here and the poster above remains the permanent hero. -->
	<PremiumHero />

	<div class="hero__content">
		<h1>{site.home.heroHeadline}</h1>
		<p class="hero__subhead">{site.home.heroSubhead}</p>
		<a class="hero__cta" href={resolve('/contact')}>{site.contact.ctaPhrase}</a>
	</div>
</section>

<style>
	.hero {
		position: relative;
		display: grid;
		align-items: center;
		min-height: clamp(20rem, 52vh, 32rem);
		padding: var(--space-8) var(--space-5);
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border);
		/* --glow is `none` in Accessible mode and a soft halo in Premium — no motion either way. */
		box-shadow: var(--glow);
	}

	.hero__poster {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		/* decorative only — never captures pointer/AT focus */
		pointer-events: none;
	}

	/* token-driven colors for the SVG (no raw hex — raw-hex gate enforced) */
	.hero__scrim-in {
		stop-color: var(--accent);
		stop-opacity: 0.28;
	}
	.hero__scrim-mid {
		stop-color: var(--primary);
		stop-opacity: 0.16;
	}
	.hero__scrim-out {
		stop-color: var(--primary);
		stop-opacity: 0;
	}
	.hero__rings circle {
		stroke: var(--primary);
		stroke-width: 2;
	}
	.hero__accent circle {
		stroke: var(--accent);
		stroke-width: 2;
	}
	.hero__nodes circle {
		fill: var(--primary);
	}

	.hero__content {
		position: relative; /* above the poster */
		max-width: var(--measure);
	}
	.hero h1 {
		margin: 0 0 var(--space-4);
		font-size: var(--fs-h1);
		color: var(--text);
	}
	.hero__subhead {
		margin: 0 0 var(--space-6);
		max-width: 46ch;
		font-size: var(--fs-lg);
		color: var(--text-muted);
	}
	.hero__cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		padding: var(--space-3) var(--space-6);
		background: var(--primary);
		color: var(--on-primary);
		border-radius: var(--radius-md);
		font-weight: 600;
		text-decoration: none;
	}
	.hero__cta:hover {
		background: var(--primary-hover, var(--primary));
	}
	/* focus ring inherited from global :focus-visible in tokens.css. No load/hover motion (A11Y-08). */
</style>

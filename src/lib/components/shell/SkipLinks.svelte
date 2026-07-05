<!--
	SkipLinks (A11Y-01) — two visible-on-focus bypass links, rendered as the FIRST children in
	+layout.svelte so they are the very first tab stop. Styling comes entirely from the global
	`.skip-link` utility in tokens.css (off-screen → visible on :focus). Targets: `#main` (the
	<main> in +layout.svelte, tabindex="-1") and `#nav` (the <nav> in SiteHeader).
-->
<a class="skip-link" href="#main">Skip to main content</a>
<a class="skip-link" href="#nav">Skip to navigation</a>

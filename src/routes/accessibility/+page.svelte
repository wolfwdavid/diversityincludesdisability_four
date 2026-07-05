<!-- /accessibility (A11Y-07) — the Accessibility Statement in the scope.org.uk four-section shape:
     conformance target, known issues, feedback path, and review cadence. Single <h1> followed by four
     landmark sections (each aria-labelledby its own heading). Every string comes from site.a11yStatement
     (CONT-06); the known-issues list honestly names the pending [REVIEW] items (social URLs, no 3D hero
     yet) rather than presenting a fake-perfect record. -->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import { site } from '$lib/content/site';
</script>

<Seo
	title={site.seo.accessibility.title}
	description={site.seo.accessibility.description}
	path="/accessibility/"
/>

<article class="a11y">
	<h1>Accessibility</h1>

	<section class="a11y__section" aria-labelledby="conf-h">
		<h2 id="conf-h">Conformance target</h2>
		<p>{site.a11yStatement.conformanceTarget}</p>
	</section>

	<section class="a11y__section" aria-labelledby="issues-h">
		<h2 id="issues-h">Known issues</h2>
		<ul>
			{#each site.a11yStatement.knownIssues as issue (issue)}
				<li>{issue}</li>
			{/each}
		</ul>
	</section>

	<section class="a11y__section" aria-labelledby="feedback-h">
		<h2 id="feedback-h">Give feedback</h2>
		<p>
			Found a barrier or have a suggestion? We want to hear about it.
			<a href={`mailto:${site.a11yStatement.feedbackEmail}`}>Email us</a> and we will respond as soon
			as we can.
		</p>
	</section>

	<section class="a11y__section" aria-labelledby="review-h">
		<h2 id="review-h">Review cadence</h2>
		<p>{site.a11yStatement.reviewCadence} Last reviewed {site.a11yStatement.lastReviewed}.</p>
	</section>
</article>

<style>
	.a11y {
		max-width: var(--measure);
		margin-inline: auto;
		padding: var(--space-7) var(--space-5);
	}
	.a11y h1 {
		font-size: var(--fs-h1);
		margin: 0 0 var(--space-6);
	}
	.a11y__section {
		margin: 0 0 var(--space-7);
	}
	.a11y__section h2 {
		font-size: var(--fs-h2);
		margin: 0 0 var(--space-4);
	}
	.a11y__section p,
	.a11y__section li {
		font-size: var(--fs-lg);
	}
	.a11y__section ul {
		margin: 0;
		padding-left: var(--space-5);
	}
	.a11y__section li {
		margin-bottom: var(--space-3);
	}
	.a11y__section a {
		color: var(--primary);
		font-weight: 600;
		text-decoration: underline;
	}
	.a11y__section a:hover {
		color: var(--primary-hover, var(--primary));
	}
</style>

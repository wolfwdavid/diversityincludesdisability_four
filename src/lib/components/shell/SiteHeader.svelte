<script lang="ts">
	// SiteHeader — the persistent top-of-page landmark for every route (A11Y-02).
	// Composes: brand link (NOT a heading — the sole <h1> lives in each page's <main>),
	// a primary <nav> (labeled), the APG Disclosure mobile menu button (A11Y-05), and the
	// Phase-2 <ModeToggle>. All internal links go through resolve() so they survive the
	// GitHub Pages base path. Active link is marked with aria-current="page" via page.route.id
	// (base- and trailing-slash-independent — see 03-RESEARCH Pattern 3).
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ModeToggle from '$lib/components/shell/ModeToggle.svelte';
	import { site } from '$lib/content/site';

	const nav = [
		{ href: '/', label: 'Home' },
		{ href: '/about', label: 'About' },
		{ href: '/services', label: 'Services' },
		{ href: '/contact', label: 'Contact' }
	] as const;

	// Mobile disclosure state. Desktop shows the list via CSS regardless of this flag.
	let open = $state(false);

	// Auto-close the mobile menu whenever the route changes (rune reacts to navigation).
	$effect(() => {
		page.url.pathname;
		open = false;
	});

	// APG Disclosure: Escape closes the open menu and returns focus to the toggle button.
	// This is a disclosure, NOT a modal — focus is intentionally free to leave (no trap).
	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
			(document.getElementById('nav-toggle') as HTMLButtonElement | null)?.focus();
		}
	}
</script>

<header class="site-header">
	<a class="brand" href={resolve('/')}>{site.org}</a>

	<div class="header-actions">
		<button
			id="nav-toggle"
			type="button"
			class="nav-toggle"
			aria-expanded={open}
			aria-controls="primary-nav-list"
			onclick={() => (open = !open)}
		>
			<svg class="nav-toggle__icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
				<path
					d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
			<span>Menu</span>
		</button>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<nav id="nav" aria-label="Primary" onkeydown={onKeydown}>
			<ul id="primary-nav-list" class:open>
				{#each nav as item (item.href)}
					<li>
						<a
							href={resolve(item.href)}
							aria-current={page.route.id === item.href ? 'page' : undefined}
						>
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<ModeToggle />
	</div>
</header>

<style>
	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}
	.brand {
		color: var(--primary);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: var(--fs-lg);
		text-decoration: none;
	}
	.brand:hover {
		text-decoration: underline;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	/* Mobile disclosure button (A11Y-04: ≥44px target). Hidden on desktop. */
	.nav-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 44px;
		min-width: 44px;
		padding: var(--space-2) var(--space-4);
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		font: inherit;
		cursor: pointer;
	}
	.nav-toggle:hover {
		background: var(--bg);
	}
	.nav-toggle__icon {
		flex: none;
	}

	/* Mobile-first: nav list is hidden until the disclosure is open. */
	#primary-nav-list {
		display: none;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	#primary-nav-list.open {
		display: block;
		position: absolute;
		right: var(--space-5);
		left: var(--space-5);
		margin-top: var(--space-2);
		padding: var(--space-2);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow);
		z-index: 90;
	}
	#primary-nav-list li {
		list-style: none;
	}
	/* Link target boxes are ≥44px tall (A11Y-04). */
	#primary-nav-list a {
		display: flex;
		align-items: center;
		min-height: 44px;
		padding: var(--space-2) var(--space-4);
		color: var(--text);
		text-decoration: none;
		border-radius: var(--radius-sm);
	}
	#primary-nav-list a:hover {
		background: var(--bg);
		text-decoration: underline;
	}
	#primary-nav-list a[aria-current='page'] {
		color: var(--primary);
		font-weight: 600;
	}

	/* Desktop: the list is a horizontal bar and the toggle disappears. */
	@media (min-width: 48rem) {
		.nav-toggle {
			display: none;
		}
		#primary-nav-list,
		#primary-nav-list.open {
			display: flex;
			gap: var(--space-5);
			position: static;
			margin: 0;
			padding: 0;
			background: none;
			border: 0;
			box-shadow: none;
		}
	}
</style>

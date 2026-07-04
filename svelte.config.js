import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Defaults: pages/assets => 'build'.
			fallback: '404.html' // SPA fallback for deep links / hard refresh on Pages
		}),
		paths: {
			base: dev ? '' : (process.env.BASE_PATH ?? ''),
			// Emit absolute, base-prefixed asset URLs (e.g. /diversityincludesdisability_four/_app/...)
			// in EVERY prerendered page, not just the SPA fallback. SvelteKit already forces absolute
			// URLs in 404.html because it can be served at any depth; setting relative:false makes
			// index.html (and all future nested routes) consistent with it, so _app/immutable chunks
			// resolve correctly from any path on GitHub Pages under the base.
			relative: false
		},
		prerender: {
			entries: ['*'],
			handleHttpError: 'fail',
			handleMissingId: 'fail'
		}
	}
};

export default config;

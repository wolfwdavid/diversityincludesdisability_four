import { browser } from '$app/environment';

/**
 * Reactive `prefers-reduced-motion` rune. Browser-guarded so it is prerender-safe
 * (SSR keeps `current = false`, matching the no-motion-known default). Listens for
 * live OS toggles so a mid-session change is respected without a reload.
 *
 * This module imports ONLY `$app/environment` — it must never import `three`/`@threlte`,
 * because it is reached by the three-free boundary in the Accessible graph (PREM-02).
 */
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

// Cheap synchronous WebGL feature-detect BEFORE importing three (avoid loading ~150KB to fail).
// Memoized: the context probe runs at most once per session.
let _webgl: boolean | null = null;
export function webglSupported(): boolean {
	if (!browser) return false;
	if (_webgl !== null) return _webgl;
	try {
		const c = document.createElement('canvas');
		_webgl = !!(c.getContext('webgl2') || c.getContext('webgl'));
	} catch {
		_webgl = false;
	}
	return _webgl;
}

import { browser } from '$app/environment';

export type Mode = 'accessible' | 'premium';
const KEY = 'did-mode';

/** Initialize FROM the attribute the inline no-flash script already set.
 *  The inline script is the single owner of priority (stored → OS → default),
 *  so the store never re-derives it and cannot disagree (no hydration re-flip). */
function initial(): Mode {
	if (!browser) return 'accessible'; // prerender-safe default
	return document.documentElement.dataset.mode === 'premium' ? 'premium' : 'accessible';
}

class ModeState {
	current = $state<Mode>(initial());
	announcement = $state('');

	set(next: Mode) {
		if (next === this.current) return;
		this.current = next;
		this.announcement =
			next === 'accessible'
				? 'Accessible mode on. High contrast, reduced motion.'
				: 'Premium visual mode on.';
		if (browser) {
			try {
				localStorage.setItem(KEY, next);
			} catch {
				/* private mode */
			}
			document.documentElement.dataset.mode = next;
		}
	}

	toggle() {
		this.set(this.current === 'premium' ? 'accessible' : 'premium');
	}
}

export const mode = new ModeState();

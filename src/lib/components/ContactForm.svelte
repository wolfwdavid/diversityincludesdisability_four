<script lang="ts">
	import { base } from '$app/paths';
	import { site } from '$lib/content/site';

	let { accessKey }: { accessKey: string } = $props();
	const ENDPOINT = 'https://api.web3forms.com/submit';
	const copy = site.contactForm;

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let botcheck = $state(false); // WARNING 1: bound honeypot — a JS bot that ticks it is forwarded & caught
	let touched = $state({ name: false, email: false, message: false });
	let status = $state<'idle' | 'sending' | 'ok' | 'error'>('idle');

	const errors = $derived({
		name: touched.name && !name.trim() ? copy.errors.name : '',
		email: touched.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? copy.errors.email : '',
		message: touched.message && message.trim().length < 10 ? copy.errors.message : ''
	});

	function firstErrorId(): string | null {
		if (errors.name) return 'cf-name';
		if (errors.email) return 'cf-email';
		if (errors.message) return 'cf-message';
		return null;
	}

	async function submitForm(e: Event) {
		e.preventDefault();
		if (status === 'sending') return;
		touched = { name: true, email: true, message: true };
		const bad = firstErrorId();
		if (bad) {
			document.getElementById(bad)?.focus();
			return;
		}
		status = 'sending';
		try {
			const res = await fetch(ENDPOINT, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({ access_key: accessKey, name, email, message, botcheck })
			});
			const data = await res.json();
			status = data.success ? 'ok' : 'error';
		} catch {
			status = 'error';
		}
	}
</script>

<form
	class="cf"
	action={ENDPOINT}
	method="POST"
	enctype="multipart/form-data"
	onsubmit={submitForm}
>
	<input type="hidden" name="access_key" value={accessKey} />
	<!-- No-JS submitters redirect to our own prerendered success page (same-domain, free tier). -->
	<input type="hidden" name="redirect" value={`${site.url}${base}/contact/success/`} />

	<!-- a11y-safe honeypot: off-screen, out of tab order, hidden from AT. Never `required`.
	     Bound to `botcheck` so the JS path forwards a real value (a JS bot that ticks it is caught). -->
	<div class="cf-hp" aria-hidden="true">
		<label>
			{copy.honeypotLabel}
			<input
				type="checkbox"
				name="botcheck"
				tabindex="-1"
				autocomplete="off"
				bind:checked={botcheck}
			/>
		</label>
	</div>

	<div class="cf-field">
		<label for="cf-name">{copy.nameLabel}</label>
		<input
			id="cf-name"
			name="name"
			type="text"
			autocomplete="name"
			bind:value={name}
			onblur={() => (touched = { ...touched, name: true })}
			aria-invalid={!!errors.name}
			aria-describedby={errors.name ? 'cf-name-error' : undefined}
		/>
		{#if errors.name}
			<p id="cf-name-error" class="cf-error" role="alert">
				<span aria-hidden="true">⚠ </span>Error: {errors.name}
			</p>
		{/if}
	</div>

	<div class="cf-field">
		<label for="cf-email">{copy.emailLabel}</label>
		<input
			id="cf-email"
			name="email"
			type="email"
			inputmode="email"
			autocomplete="email"
			bind:value={email}
			onblur={() => (touched = { ...touched, email: true })}
			aria-invalid={!!errors.email}
			aria-describedby={errors.email ? 'cf-email-error' : undefined}
		/>
		{#if errors.email}
			<p id="cf-email-error" class="cf-error" role="alert">
				<span aria-hidden="true">⚠ </span>Error: {errors.email}
			</p>
		{/if}
	</div>

	<div class="cf-field">
		<label for="cf-message">{copy.messageLabel}</label>
		<textarea
			id="cf-message"
			name="message"
			rows="5"
			bind:value={message}
			onblur={() => (touched = { ...touched, message: true })}
			aria-invalid={!!errors.message}
			aria-describedby={errors.message ? 'cf-message-error' : undefined}></textarea>
		{#if errors.message}
			<p id="cf-message-error" class="cf-error" role="alert">
				<span aria-hidden="true">⚠ </span>Error: {errors.message}
			</p>
		{/if}
	</div>

	<button type="submit" class="cf-submit" aria-disabled={status === 'sending'}>
		{status === 'sending' ? copy.sending : copy.submit}
	</button>

	<p
		id="cf-status"
		class="cf-status"
		class:cf-status--ok={status === 'ok'}
		class:cf-status--error={status === 'error'}
		role={status === 'error' ? 'alert' : 'status'}
		aria-live={status === 'error' ? 'assertive' : 'polite'}
	>
		{#if status === 'sending'}{copy.status.sending}
		{:else if status === 'ok'}{copy.status.ok} {site.founder} will be in touch.
		{:else if status === 'error'}
			{copy.status.error}
			<button type="button" class="cf-retry" onclick={submitForm}>{copy.status.retry}</button>
			or email <a href={`mailto:${site.contact.email}`}>{site.founder}</a> directly.
		{/if}
	</p>
</form>

<style>
	.cf {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 44ch;
	}
	.cf-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.cf label {
		font-weight: 600;
	}
	.cf input,
	.cf textarea {
		min-height: 44px;
		padding: var(--space-2) var(--space-3);
		font: inherit;
		color: var(--text);
		background: var(--bg);
		border: 2px solid var(--field-border);
		border-radius: var(--radius-sm);
	}
	.cf input[aria-invalid='true'],
	.cf textarea[aria-invalid='true'] {
		border-color: var(--danger);
	}
	.cf-error {
		margin: 0;
		color: var(--danger);
		font-weight: 600;
	}
	.cf-submit {
		align-self: flex-start;
		min-height: 44px;
		padding: var(--space-2) var(--space-5);
		font: inherit;
		font-weight: 600;
		color: var(--on-primary);
		background: var(--primary);
		border: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	.cf-submit[aria-disabled='true'] {
		opacity: 0.7;
		cursor: progress;
	}
	.cf-status {
		margin: 0;
		min-height: 1.5em;
	}
	.cf-status--ok {
		color: var(--success);
		font-weight: 600;
	}
	.cf-status--error {
		color: var(--danger);
		font-weight: 600;
	}
	.cf-retry {
		min-height: 44px;
		padding: var(--space-1) var(--space-4);
		font: inherit;
		color: var(--on-primary);
		background: var(--primary);
		border: 0;
		border-radius: var(--radius-sm);
		cursor: pointer;
	}
	/* off-screen honeypot — NOT display:none (bots skip it); aria-hidden wrapper keeps it out of AT */
	.cf-hp {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
</style>

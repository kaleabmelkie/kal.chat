import { dev } from '$app/environment'
import { PUBLIC_SENTRY_SVELTE_DSN } from '$env/static/public'
import * as SentrySvelte from '@sentry/svelte'

if (!dev) {
	SentrySvelte.init({
		dsn: PUBLIC_SENTRY_SVELTE_DSN,

		integrations: [new SentrySvelte.BrowserTracing()],

		tracesSampleRate: 1.0,
	})

	SentrySvelte.setTag('svelteKit', 'browser')
}

export const handleError = ({ error, event }) => {
	if (!dev) {
		SentrySvelte.captureException(error, { contexts: { sveltekit: { event } } })
	}

	return {
		message: (error as Error)?.message ?? 'Unknown error',
	}
}

import { PUBLIC_SENTRY_BROWSER_DSN } from '$env/static/public'
import * as SentrySvelte from '@sentry/svelte'
import { BrowserTracing } from '@sentry/tracing'

SentrySvelte.init({
	dsn: PUBLIC_SENTRY_BROWSER_DSN,
	integrations: [new BrowserTracing()],
	tracesSampleRate: 1.0,
})
SentrySvelte.setTag('svelteKit', 'browser')

export const handleError = ({ error, event }) => {
	SentrySvelte.captureException(error, { contexts: { sveltekit: { event } } })

	return {
		message: (error as Error)?.message ?? 'Unknown error',
	}
}

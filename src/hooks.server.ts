import { dev } from '$app/environment'
import { SENTRY_NODE_DSN } from '$env/static/private'
import { authHook } from '$lib/hooks/auth-hook.server'
import * as SentryNode from '@sentry/node'
import '@sentry/tracing'
import { sequence } from '@sveltejs/kit/hooks'

if (!dev) {
	SentryNode.init({
		dsn: SENTRY_NODE_DSN,

		integrations: [new SentryNode.Integrations.Http()],

		tracesSampleRate: 1.0,
	})

	SentryNode.setTag('svelteKit', 'server')
}

export const handleError = ({ error, event }) => {
	if (!dev) {
		SentryNode.captureException(error, { contexts: { sveltekit: { event } } })
	}

	return {
		message: (error as Error)?.message ?? 'Unknown error',
	}
}

export const handle = sequence(authHook)

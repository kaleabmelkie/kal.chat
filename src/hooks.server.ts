import { SENTRY_NODE_DSN } from '$env/static/private'
import { authHook } from '$lib/utils/auth-hook.server'
import * as SentryNode from '@sentry/node'
import '@sentry/tracing'
import { sequence } from '@sveltejs/kit/hooks'

SentryNode.init({
	dsn: SENTRY_NODE_DSN,
	tracesSampleRate: 1.0,
	integrations: [new SentryNode.Integrations.Http()],
})
SentryNode.setTag('svelteKit', 'server')

export const handleError = ({ error, event }) => {
	SentryNode.captureException(error, { contexts: { sveltekit: { event } } })
	return {
		message: (error as Error)?.message ?? 'Unknown error',
	}
}

export const handle = sequence(authHook)

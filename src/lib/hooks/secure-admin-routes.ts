import { ADMIN_LOGIN } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'

export const secureAdminRoutes: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		if (
			event.request.headers.get('Authorization') !==
			`Basic ${Buffer.from(ADMIN_LOGIN).toString('base64')}`
		) {
			return new Response('Not authorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Admin access", charset="UTF-8"',
				},
			})
		}
	}

	return await resolve(event)
}

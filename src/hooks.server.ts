import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private'
import GitHub from '@auth/core/providers/github'
import { SvelteKitAuth } from '@auth/sveltekit'

export const handle = SvelteKitAuth({
	providers: [
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET }),
	],
	secret: AUTH_SECRET,
})

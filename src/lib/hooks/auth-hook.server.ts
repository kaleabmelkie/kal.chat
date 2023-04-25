import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_SECRET,
	AUTH_TRUST_HOST,
	AUTH_USE_SECURE_COOKIES,
} from '$env/static/private'
import { prisma } from '$lib/utils/prisma.server'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'

import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'

export const authHookConfig: SvelteKitAuthConfig = {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	providers: [
		!AUTH_GITHUB_ID || !AUTH_GITHUB_SECRET
			? null
			: GitHub({ clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }),

		!AUTH_GOOGLE_ID || !AUTH_GOOGLE_SECRET
			? null
			: Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }),
	].filter((p) => p !== null),

	secret: AUTH_SECRET,
	trustHost: AUTH_TRUST_HOST === 'true',
	useSecureCookies: AUTH_USE_SECURE_COOKIES === 'true',

	callbacks: {
		signIn: async (params) => {
			if (!params.user.email) {
				throw new Error(
					`Email not found in your ${params.account?.provider ?? `login provider's`} account`,
				)
			}
			await prisma.user.upsert({
				where: { email: params.user.email },
				create: {
					name: params.user.name ?? 'User',
					email: params.user.email,
					image: params.user.image ?? null,
				},
				update: {
					name: params.user.name ?? 'User',
					email: params.user.email,
					image: params.user.image ?? null,
				},
			})
			return true
		},
	},

	theme: {
		brandColor: '#2563EB',
		colorScheme: 'auto',
		logo: '/favicon.ico',
	},
}

export const authHook = SvelteKitAuth(authHookConfig)

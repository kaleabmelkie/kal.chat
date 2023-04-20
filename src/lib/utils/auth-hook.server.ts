import { dev } from '$app/environment'
import {
	AUTH_DISCORD_ID,
	AUTH_DISCORD_SECRET,
	AUTH_FACEBOOK_ID,
	AUTH_FACEBOOK_SECRET,
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_INSTAGRAM_ID,
	AUTH_INSTAGRAM_SECRET,
	AUTH_LINKEDIN_ID,
	AUTH_LINKEDIN_SECRET,
	AUTH_SECRET,
	AUTH_TWITTER_ID,
	AUTH_TWITTER_SECRET,
} from '$env/static/private'
import { prisma } from '$lib/utils/prisma.server'
import Discord from '@auth/core/providers/discord'
import Facebook from '@auth/core/providers/facebook'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import Instagram from '@auth/core/providers/instagram'
import LinkedIn from '@auth/core/providers/linkedin'
import Twitter from '@auth/core/providers/twitter'

import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'

export const authHookConfig: SvelteKitAuthConfig = {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	providers: [
		!AUTH_DISCORD_ID || !AUTH_DISCORD_SECRET
			? null
			: Discord({ clientId: AUTH_DISCORD_ID, clientSecret: AUTH_DISCORD_SECRET }),

		!AUTH_GITHUB_ID || !AUTH_GITHUB_SECRET
			? null
			: GitHub({ clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }),

		!AUTH_GOOGLE_ID || !AUTH_GOOGLE_SECRET
			? null
			: Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }),

		!AUTH_FACEBOOK_ID || !AUTH_FACEBOOK_SECRET
			? null
			: Facebook({ clientId: AUTH_FACEBOOK_ID, clientSecret: AUTH_FACEBOOK_SECRET }),

		!AUTH_INSTAGRAM_ID || !AUTH_INSTAGRAM_SECRET
			? null
			: Instagram({ clientId: AUTH_INSTAGRAM_ID, clientSecret: AUTH_INSTAGRAM_SECRET }),

		!AUTH_LINKEDIN_ID || !AUTH_LINKEDIN_SECRET
			? null
			: LinkedIn({ clientId: AUTH_LINKEDIN_ID, clientSecret: AUTH_LINKEDIN_SECRET }),

		!AUTH_TWITTER_ID || !AUTH_TWITTER_SECRET
			? null
			: Twitter({ clientId: AUTH_TWITTER_ID, clientSecret: AUTH_TWITTER_SECRET }),
	].filter((p) => p !== null),

	secret: AUTH_SECRET,
	useSecureCookies: !dev, // disable for local build/preview only (not for production)
	// trustHost: true, // enable for local build/preview only (not for production)

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

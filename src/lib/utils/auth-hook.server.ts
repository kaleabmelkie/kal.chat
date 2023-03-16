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
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'

import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'

export const authHookConfig: SvelteKitAuthConfig = {
	providers: [
		!AUTH_DISCORD_ID || !AUTH_DISCORD_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  Discord({
					clientId: AUTH_DISCORD_ID,
					clientSecret: AUTH_DISCORD_SECRET,
			  }),

		!AUTH_GITHUB_ID || !AUTH_GITHUB_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  GitHub({
					clientId: AUTH_GITHUB_ID,
					clientSecret: AUTH_GITHUB_SECRET,
			  }),

		!AUTH_GOOGLE_ID || !AUTH_GOOGLE_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  Google({
					clientId: AUTH_GOOGLE_ID,
					clientSecret: AUTH_GOOGLE_SECRET,
			  }),

		!AUTH_FACEBOOK_ID || !AUTH_FACEBOOK_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  Facebook({
					clientId: AUTH_FACEBOOK_ID,
					clientSecret: AUTH_FACEBOOK_SECRET,
			  }),

		!AUTH_INSTAGRAM_ID || !AUTH_INSTAGRAM_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  Instagram({
					clientId: AUTH_INSTAGRAM_ID,
					clientSecret: AUTH_INSTAGRAM_SECRET,
			  }),

		!AUTH_LINKEDIN_ID || !AUTH_LINKEDIN_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  LinkedIn({
					clientId: AUTH_LINKEDIN_ID,
					clientSecret: AUTH_LINKEDIN_SECRET,
			  }),

		!AUTH_TWITTER_ID || !AUTH_TWITTER_SECRET
			? null
			: // eslint-disable-next-line @typescript-eslint/ban-ts-comment
			  // @ts-ignore
			  Twitter({
					clientId: AUTH_TWITTER_ID,
					clientSecret: AUTH_TWITTER_SECRET,
			  }),
	].filter((p) => p !== null),

	trustHost: true,
	secret: AUTH_SECRET,

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
}

export const authHook = SvelteKitAuth(authHookConfig)

import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_USE_SECURE_COOKIES,
	OWN_OPENAI_API_KEY_ENCRYPTION_KEY,
} from '$env/static/private'
import { decrypt } from '$lib/utils/encryption'
import { prisma } from '$lib/utils/prisma.server'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'

import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'

export const authHookConfig: SvelteKitAuthConfig = {
	providers: [
		Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }),
		GitHub({ clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }),
	],

	useSecureCookies: AUTH_USE_SECURE_COOKIES === 'true',

	callbacks: {
		signIn: async (params) => {
			if (!params.profile?.email) {
				throw new Error(
					`Email not found in your ${params.account?.provider ?? `login provider's`} account`,
				)
			}
			await prisma.user.upsert({
				where: {
					email: params.profile.email,
				},
				create: {
					name: params.profile.name ?? 'User',
					email: params.profile.email,
					image:
						params.profile.picture ?? // google
						params.profile.avatar_url ?? // github
						null,
				},
				update: {
					name: params.profile.name ?? 'User',
					email: params.profile.email,
					image:
						params.profile.picture ?? // google
						params.profile.avatar_url ?? // github
						null,
				},
			})
			return true
		},

		jwt: async (params) => {
			if (!params.token.email) {
				throw new Error(`Email not found in your JWT token.`)
			}
			const user = await prisma.user.findUnique({
				where: {
					email: params.token.email,
				},
				select: {
					id: true,
					plan: true,
					encryptedOwnOpenAiApiKey: true,
				},
			})
			if (!user) {
				throw new Error(`User not found in your database.`)
			}
			return {
				...params.token,
				userId: user.id,
				userPlan: user.plan,
				ownOpenAiApiKey: !user.encryptedOwnOpenAiApiKey
					? null
					: decrypt(user.encryptedOwnOpenAiApiKey, OWN_OPENAI_API_KEY_ENCRYPTION_KEY),
			}
		},

		session: async (params) => {
			return {
				...params.session,
				user: {
					...params.session.user,
					id: params.token.userId,
					plan: params.token.userPlan,
					ownOpenAiApiKey: params.token.ownOpenAiApiKey,
				},
			}
		},
	},

	theme: {
		brandColor: '#2563EB',
		colorScheme: 'auto',
		logo: '/favicon.ico',
	},
}

export const authHook = SvelteKitAuth(authHookConfig)

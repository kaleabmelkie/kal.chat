import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_SECRET,
} from '$env/static/private'
import { prisma } from '$lib/utils/prisma.server'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'

export const authHookConfig: SvelteKitAuthConfig = {
	providers: [
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		Google({
			clientId: AUTH_GOOGLE_ID,
			clientSecret: AUTH_GOOGLE_SECRET,
		}),

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		GitHub({
			clientId: AUTH_GITHUB_ID,
			clientSecret: AUTH_GITHUB_SECRET,
		}),
	],
	secret: AUTH_SECRET,

	callbacks: {
		signIn: async (params) => {
			if (!params.user.email) {
				throw new Error('Email not found')
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

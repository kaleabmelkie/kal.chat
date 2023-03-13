import { AUTH_SECRET, GITHUB_ID, GITHUB_SECRET } from '$env/static/private'
import { prisma } from '$lib/utils/prisma.server'
import GitHub from '@auth/core/providers/github'
import { SvelteKitAuth } from '@auth/sveltekit'

export const handle = SvelteKitAuth({
	providers: [
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		GitHub({ clientId: GITHUB_ID, clientSecret: GITHUB_SECRET }),
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
})

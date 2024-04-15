import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_USE_SECURE_COOKIES,
	OWN_OPENAI_API_KEY_ENCRYPTION_KEY,
} from '$env/static/private'
import { db } from '$lib/drizzle/db.server'
import { usersTable } from '$lib/drizzle/schema/users.server'
import { decrypt } from '$lib/utils/encryption'
import GitHub from '@auth/core/providers/github'
import Google from '@auth/core/providers/google'
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'
import { eq } from 'drizzle-orm'

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
			const existingUser = await db.query.usersTable.findFirst({
				where: eq(usersTable.email, params.profile.email),
			})
			const now = new Date()
			if (!existingUser) {
				await db.insert(usersTable).values({
					createdAt: now,
					updatedAt: now,
					name: params.profile.name ?? 'User',
					email: params.profile.email,
					image:
						params.profile.picture ?? // google
						params.profile.avatar_url ?? // github
						null,
				})
			} else {
				await db
					.update(usersTable)
					.set({
						updatedAt: now,
						name: params.profile.name ?? existingUser.name,
						email: params.profile.email ?? existingUser.email,
						image:
							params.profile.picture ?? // google
							params.profile.avatar_url ?? // github
							existingUser.image,
					})
					.where(eq(usersTable.email, params.profile.email))
			}
			return true
		},

		jwt: async (params) => {
			if (!params.token.email) {
				throw new Error(`Email not found in your JWT token.`)
			}
			const user = await db.query.usersTable.findFirst({
				where: eq(usersTable.email, params.token.email),
				columns: {
					id: true,
					plan: true,
					encryptedOwnOpenaiApiKey: true,
				},
			})
			if (!user) {
				throw new Error(`User not found in your database.`)
			}
			return {
				...params.token,
				userId: user.id,
				userPlan: user.plan,
				ownOpenaiApiKey: !user.encryptedOwnOpenaiApiKey
					? null
					: decrypt(user.encryptedOwnOpenaiApiKey, OWN_OPENAI_API_KEY_ENCRYPTION_KEY),
			}
		},

		session: async (params) => {
			return {
				...params.session,
				user: {
					...params.session.user,
					id: params.token.userId,
					plan: params.token.userPlan,
					ownOpenaiApiKey: params.token.ownOpenaiApiKey,
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

import {
	AUTH_GITHUB_ID,
	AUTH_GITHUB_SECRET,
	AUTH_GOOGLE_ID,
	AUTH_GOOGLE_SECRET,
	AUTH_USE_SECURE_COOKIES,
	OWN_OPENAI_API_KEY_ENCRYPTION_KEY,
} from '$env/static/private'
import { db } from '$lib/drizzle/db.server'
import {
	insertUserSchema,
	updateUserSchema,
	usersTable,
	type InsertUser,
	type SelectUser,
	type UpdateUser,
} from '$lib/drizzle/schema/users.server'
import { decrypt } from '$lib/utils/encryption'
import { SvelteKitAuth, type SvelteKitAuthConfig } from '@auth/sveltekit'
import GitHub from '@auth/sveltekit/providers/github'
import Google from '@auth/sveltekit/providers/google'
import { eq } from 'drizzle-orm'

export const authHookConfig: SvelteKitAuthConfig = {
	providers: [
		Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }),
		GitHub({ clientId: AUTH_GITHUB_ID, clientSecret: AUTH_GITHUB_SECRET }),
	],

	trustHost: true,

	useSecureCookies: AUTH_USE_SECURE_COOKIES === 'true',

	callbacks: {
		async signIn(params) {
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
				await db.insert(usersTable).values(
					insertUserSchema.parse({
						createdAt: now,
						updatedAt: now,
						name: params.profile.name ?? 'User',
						email: params.profile.email,
						image:
							params.profile.picture ?? // google
							params.profile.avatar_url ?? // github
							null,
					} satisfies InsertUser) satisfies InsertUser,
				)
			} else {
				await db
					.update(usersTable)
					.set(
						updateUserSchema.parse({
							updatedAt: now,
							name: params.profile.name ?? existingUser.name,
							email: params.profile.email ?? existingUser.email,
							image:
								params.profile.picture ?? // google
								params.profile.avatar_url ?? // github
								existingUser.image,
						} satisfies UpdateUser) satisfies UpdateUser,
					)
					.where(eq(usersTable.email, params.profile.email))
			}
			return true
		},

		async jwt(params) {
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

		async session(params) {
			return {
				...params.session,
				user: {
					...params.session.user,
					id: params.token.userId as number,
					plan: params.token.userPlan as SelectUser['plan'],
					ownOpenaiApiKey: params.token.ownOpenaiApiKey as string | null,
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

export const { handle: authHook } = SvelteKitAuth(authHookConfig)

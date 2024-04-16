import { db } from '$lib/drizzle/db.server.js'
import { messagesTable } from '$lib/drizzle/schema/messages.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { authHookConfig } from '$lib/hooks/auth-hook.server'
import type { Profile } from '@auth/sveltekit'
import type { OAuth2Config, OIDCConfig } from '@auth/sveltekit/providers'
import { redirect } from '@sveltejs/kit'
import { and, count, eq, not } from 'drizzle-orm'

export async function load(event) {
	const { session } = await event.parent()

	const requestedRedirectTo = event.url.searchParams.get('redirectTo') ?? null
	const redirectTo = `/${requestedRedirectTo?.slice(1) ?? ''}`

	if (typeof session?.user?.id === 'number' && requestedRedirectTo !== null) {
		throw redirect(302, redirectTo)
	}

	return {
		redirectTo,
		providers: authHookConfig.providers
			.filter(
				(p) =>
					(p as OAuth2Config<Profile>).type === 'oauth' ||
					(p as OIDCConfig<Profile>).type === 'oidc',
			)
			.map((p) => ({
				id: (p as OAuth2Config<Profile> | OIDCConfig<Profile>).id,
				name: (p as OAuth2Config<Profile> | OIDCConfig<Profile>).name,
				type: (p as OAuth2Config<Profile> | OIDCConfig<Profile>).type,
				style: (p as OAuth2Config<Profile> | OIDCConfig<Profile>).style,
			})),
		topicsCount:
			typeof session?.user?.id !== 'number'
				? 0
				: (
						await db
							.select({ count: count() })
							.from(topicsTable)
							.where(eq(topicsTable.userId, session.user.id))
				  )[0].count,
		messagesCount:
			typeof session?.user?.id !== 'number'
				? 0
				: (
						await db
							.select({ count: count() })
							.from(messagesTable)
							.leftJoin(topicsTable, eq(messagesTable.topicId, topicsTable.id))
							.where(
								and(not(eq(messagesTable.role, 'system')), eq(topicsTable.userId, session.user.id)),
							)
				  )[0].count,
	}
}

import { authHookConfig } from '$lib/hooks/auth-hook.server'
import { prisma } from '$lib/utils/prisma.server'
import type { OAuth2Config, OIDCConfig } from '@auth/core/providers/oauth.js'
import type { Profile } from '@auth/core/types.js'
import { redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()

	const requestedRedirectTo = event.url.searchParams.get('redirectTo') ?? null
	const redirectTo = `/${requestedRedirectTo?.slice(1) ?? ''}`

	if (typeof session?.user.id === 'number' && requestedRedirectTo !== null) {
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
			typeof session?.user.id !== 'number'
				? 0
				: prisma.topic.count({
						where: {
							userId: session.user.id,
						},
				  }),
		messagesCount:
			typeof session?.user.id !== 'number'
				? 0
				: prisma.message.count({
						where: {
							role: { not: 'system' },
							topic: {
								userId: session.user.id,
							},
						},
				  }),
	}
}

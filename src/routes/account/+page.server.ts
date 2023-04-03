import { authHookConfig } from '$lib/utils/auth-hook.server'
import { prisma } from '$lib/utils/prisma.server'
import type { OAuth2Config, OIDCConfig } from '@auth/core/src/providers/oauth'
import type { Profile } from '@auth/core/types'
import { redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()

	const requestedRedirectTo = event.url.searchParams.get('redirectTo') ?? null
	const redirectTo = `/${requestedRedirectTo?.slice(1) ?? ''}`

	if (session?.user?.email && requestedRedirectTo !== null) {
		throw redirect(302, redirectTo)
	}

	return {
		redirectTo,
		providers: authHookConfig.providers
			.filter((p) => p.type === 'oauth' || p.type === 'oidc')
			.map((p) => ({
				id: p.id,
				name: p.name,
				type: p.type,
				style: (p as OAuth2Config<Profile> | OIDCConfig<Profile>).style,
			})),
		topicsCount: !session?.user?.email
			? 0
			: prisma.topic.count({
					where: {
						user: {
							email: session.user.email,
						},
					},
			  }),
		messagesCount: !session?.user?.email
			? 0
			: prisma.message.count({
					where: {
						role: { not: 'system' },
						topic: {
							user: {
								email: session.user.email,
							},
						},
					},
			  }),
	}
}

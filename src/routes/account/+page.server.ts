import { authHookConfig } from '$lib/utils/auth-hook.server'
import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

/**
 * A clone (copy/paste) from '@auth/core/src/providers/oauth'
 * It was cloned because 'svelte-check' was complaining
 */
interface OAuthProviderButtonStyles {
	logo: string
	logoDark: string
	bg: string
	bgDark: string
	text: string
	textDark: string
}

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
				style: (p as typeof p & { style?: OAuthProviderButtonStyles }).style,
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

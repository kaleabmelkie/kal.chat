import { authHookConfig } from '$lib/utils/auth-hook.server'
import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()

	const redirectTo = event.url.searchParams.get('redirectTo') || null

	if (session?.user?.email && redirectTo !== null) {
		throw redirect(302, redirectTo)
	}

	return {
		redirectTo: redirectTo ?? '/',
		providers: authHookConfig.providers.map((p) => ({
			id: p.id,
			name: p.name,
			type: p.type,
		})),
		threadsCount: !session?.user?.email
			? 0
			: prisma.thread.count({ where: { user: { email: session.user.email } } }),
		messagesCount: !session?.user?.email
			? 0
			: prisma.message.count({ where: { thread: { user: { email: session.user.email } } } }),
	}
}

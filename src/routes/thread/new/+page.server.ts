import { generateGreeting } from '$lib/utils/generate-greeting.server'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { prisma } from '$lib/utils/prisma.server'
import type { RoleType } from '@prisma/client'
import { redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/thread/new`)}`)
	}

	const q = event.url.searchParams.get('q') || null

	const thread = await prisma.thread.create({
		data: {
			user: {
				connect: {
					email: session.user.email,
				},
			},
			Message: {
				createMany: {
					data: [
						{
							role: 'system' as const,
							content: generateSystemPrompt(session.user.name ?? undefined),
						},
						q
							? (null as unknown as { role: RoleType; content: string })
							: {
									role: 'assistant' as const,
									content: generateGreeting(session.user.name ?? 'pal'),
							  },
					].filter((d) => d !== null),
				},
			},
		},
	})

	throw redirect(302, `/thread/${thread.id}${q ? `?q=${encodeURIComponent(q)}` : ''}`)
}

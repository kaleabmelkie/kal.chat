import { generateGreeting } from '$lib/utils/generate-greeting.server'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/thread/new`)}`)
	}

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
							role: 'system',
							content: generateSystemPrompt(session.user.name ?? undefined),
						},
						{
							role: 'assistant',
							content: generateGreeting(session.user.name ?? 'pal'),
						},
					],
				},
			},
		},
	})

	throw redirect(302, `/thread/${thread.id}`)
}

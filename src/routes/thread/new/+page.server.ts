import { greetings } from '$lib/utils/greetings'
import { prisma } from '$lib/utils/prisma.server'
import { systemPrompt } from '$lib/utils/system-prompt'
import { redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/login?redirectTo=/thread/new`)
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
							content: systemPrompt,
						},
						{
							role: 'assistant',
							content: greetings[Math.floor(Math.random() * greetings.length)],
						},
					],
				},
			},
		},
	})

	throw redirect(302, `/thread/${thread.id}`)
}

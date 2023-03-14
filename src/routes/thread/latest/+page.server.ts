import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/login?redirectTo=/thread/latest`)
	}

	const thread = await prisma.thread.findFirst({
		where: {
			user: {
				email: session.user.email,
			},
		},
		orderBy: {
			id: 'desc',
		},
		take: 1,
	})

	throw redirect(302, `/thread/${thread?.id ?? 'new'}`)
}

import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const thread = await prisma.thread.findFirst({
		where: {
			user: {
				email: session.user.email,
			},
		},
		select: {
			id: true,
			title: true,
		},
		orderBy: {
			id: 'desc',
		},
		take: 1,
	})

	throw redirect(
		302,
		`/thread/${
			(thread?.id ?? null) && !(thread?.title ?? null)
				? // If there is a thread with no title, redirect to that thread
				  thread?.id
				: // Otherwise, redirect to create a new thread
				  'new'
		}`,
	)
}

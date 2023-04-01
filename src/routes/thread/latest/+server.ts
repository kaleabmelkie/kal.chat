import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export async function GET(event) {
	const session = await event.locals.getSession()
	if (!session?.user?.email) {
		throw redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const latestThread = await prisma.thread.findFirst({
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

	if (!latestThread) {
		throw redirect(302, '/thread/new')
	} else if (!latestThread.title) {
		throw redirect(302, `/thread/${latestThread.id}`)
	} else {
		const latestUntitledThread = await prisma.thread.findFirst({
			where: {
				user: {
					email: session.user.email,
				},
				title: null,
			},
			select: {
				id: true,
			},
			orderBy: {
				id: 'desc',
			},
			take: 1,
		})
		if (latestUntitledThread) {
			throw redirect(302, `/thread/${latestUntitledThread.id}`)
		} else {
			throw redirect(302, '/thread/new')
		}
	}
}

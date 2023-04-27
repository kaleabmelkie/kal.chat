import { prisma } from '$lib/utils/prisma.server'
import { redirect } from '@sveltejs/kit'

export async function GET(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const latestTopic = await prisma.topic.findFirst({
		where: {
			userId: session.user.id,
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

	if (!latestTopic) {
		throw redirect(302, '/topic/new')
	} else if (!latestTopic.title) {
		throw redirect(302, `/topic/${latestTopic.id}`)
	} else {
		const latestUntitledTopic = await prisma.topic.findFirst({
			where: {
				userId: session.user.id,
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
		if (latestUntitledTopic) {
			throw redirect(302, `/topic/${latestUntitledTopic.id}`)
		} else {
			throw redirect(302, '/topic/new')
		}
	}
}

import { db } from '$lib/drizzle/db.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { redirect } from '@sveltejs/kit'
import { and, desc, eq, isNull } from 'drizzle-orm'

export async function GET(event) {
	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const latestTopic = await db.query.topicsTable.findFirst({
		where: eq(topicsTable.userId, session.user.id),
		orderBy: desc(topicsTable.id),
		columns: {
			id: true,
			title: true,
		},
	})

	if (!latestTopic) {
		redirect(302, '/topic/new')
	} else if (!latestTopic.title) {
		redirect(302, `/topic/${latestTopic.id}`)
	} else {
		const latestUntitledTopic = await db.query.topicsTable.findFirst({
			where: and(eq(topicsTable.userId, session.user.id), isNull(topicsTable.title)),
			orderBy: desc(topicsTable.id),
			columns: {
				id: true,
			},
		})
		if (latestUntitledTopic) {
			redirect(302, `/topic/${latestUntitledTopic.id}`)
		} else {
			redirect(302, '/topic/new')
		}
	}
}

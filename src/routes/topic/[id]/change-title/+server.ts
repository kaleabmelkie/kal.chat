import { db } from '$lib/drizzle/db.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { error, json } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'

export async function PUT({ locals, params, request }) {
	const session = await locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, `You must be logged in to change a topic's title`)
	}

	const data = await request.json()
	if (typeof data?.title !== 'string') {
		throw error(400, 'You must provide a valid title')
	}

	await db
		.update(topicsTable)
		.set({
			updatedAt: new Date(),
			title: data.title,
		})
		.where(and(eq(topicsTable.id, Number(params.id)), eq(topicsTable.userId, session.user.id)))

	return json({ message: 'Topic title changed' })
}

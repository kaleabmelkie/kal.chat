import { db } from '$lib/drizzle/db.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { error, json } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'

export async function DELETE({ locals, params }) {
	const session = await locals.auth()
	if (typeof session?.user?.id !== 'number') {
		error(401, 'You must be logged in to delete a topic')
	}

	await db
		.delete(topicsTable)
		.where(and(eq(topicsTable.id, Number(params.id)), eq(topicsTable.userId, session.user.id)))

	return json({ message: 'Topic deleted' })
}

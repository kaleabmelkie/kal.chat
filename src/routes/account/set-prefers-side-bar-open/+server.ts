import { db } from '$lib/drizzle/db.server.js'
import { usersTable } from '$lib/drizzle/schema/users.server.js'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function PUT(event) {
	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	const requestJson = await event.request.json()
	if (typeof requestJson?.prefersSideBarOpen !== 'boolean') {
		throw error(400, 'Bad request')
	}

	await db
		.update(usersTable)
		.set({
			updatedAt: new Date(),
			prefersSideBarOpen: requestJson.prefersSideBarOpen,
		})
		.where(eq(usersTable.id, session.user.id))

	return json({ message: 'Preferences updated' })
}

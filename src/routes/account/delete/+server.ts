import { db } from '$lib/drizzle/db.server.js'
import { usersTable } from '$lib/drizzle/schema/users.server.js'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function DELETE(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	await db.delete(usersTable).where(eq(usersTable.id, session.user.id))

	return json({ message: 'Account deleted' })
}

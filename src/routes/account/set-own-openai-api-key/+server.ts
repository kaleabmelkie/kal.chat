import { OWN_OPENAI_API_KEY_ENCRYPTION_KEY } from '$env/static/private'
import { db } from '$lib/drizzle/db.server.js'
import { usersTable } from '$lib/drizzle/schema/users.server.js'
import { encrypt } from '$lib/utils/encryption.js'
import { error, json } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'

export async function PUT(event) {
	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	const requestJson = await event.request.json()
	if (typeof requestJson?.ownOpenaiApiKey !== 'string' && requestJson?.ownOpenaiApiKey !== null) {
		throw error(400, 'Bad request')
	}

	const encryptedOwnOpenaiApiKey = !requestJson.ownOpenaiApiKey
		? null
		: encrypt(requestJson.ownOpenaiApiKey, OWN_OPENAI_API_KEY_ENCRYPTION_KEY)

	await db
		.update(usersTable)
		.set({
			updatedAt: new Date(),
			encryptedOwnOpenaiApiKey,
		})
		.where(eq(usersTable.id, session.user.id))

	return json({
		message: `Own OpenAI API key ${encryptedOwnOpenaiApiKey !== null ? 'updated' : 'deleted'}`,
	})
}

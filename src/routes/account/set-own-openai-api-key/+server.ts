import { OWN_OPENAI_API_KEY_ENCRYPTION_KEY } from '$env/static/private'
import { encrypt } from '$lib/utils/encryption.js'
import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function PUT(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	const requestJson = await event.request.json()
	if (typeof requestJson?.ownOpenAiApiKey !== 'string' && requestJson?.ownOpenAiApiKey !== null) {
		throw error(400, 'Bad request')
	}

	const encryptedOwnOpenAiApiKey = !requestJson.ownOpenAiApiKey
		? null
		: encrypt(requestJson.ownOpenAiApiKey, OWN_OPENAI_API_KEY_ENCRYPTION_KEY)

	await prisma.user.update({
		where: {
			id: session.user.id,
		},
		data: {
			encryptedOwnOpenAiApiKey,
		},
	})

	return json({
		message: `Own OpenAI API key ${encryptedOwnOpenAiApiKey !== null ? 'updated' : 'deleted'}`,
	})
}

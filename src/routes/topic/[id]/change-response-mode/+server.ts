import { db } from '$lib/drizzle/db.server.js'
import {
	topicsTable,
	updateTopicSchema,
	type SelectTopic,
	type UpdateTopic,
} from '$lib/drizzle/schema/topics.server.js'
import { error, json } from '@sveltejs/kit'
import { and, eq } from 'drizzle-orm'

const responseModes: SelectTopic['responseMode'][] = ['faster', 'better']

export async function PUT({ locals, params, request }) {
	const session = await locals.auth()
	if (typeof session?.user?.id !== 'number') {
		error(401, `You must be logged in to change a topic's response mode`)
	}

	if (typeof params.id !== 'string') {
		error(400, 'You must provide a topic ID')
	}

	const data = await request.json()
	if (typeof data.responseMode !== 'string') {
		error(400, 'You must provide a response mode')
	}
	if (!responseModes.includes(data.responseMode)) {
		error(400, `Response mode must be one of ${responseModes.join(', ')}`)
	}

	if (
		data.responseMode === 'better' &&
		session.user.plan === 'free' &&
		!session.user.ownOpenaiApiKey
	) {
		error(
			402,
			'You must either upgrade to a paid plan or provide your own OpenAI API key (in Advanced Settings) to use the better response mode',
		)
	}

	await db
		.update(topicsTable)
		.set(
			updateTopicSchema.parse({
				updatedAt: new Date(),
				responseMode: data.responseMode,
			} satisfies UpdateTopic) satisfies UpdateTopic,
		)
		.where(and(eq(topicsTable.id, Number(params.id)), eq(topicsTable.userId, session.user.id)))

	return json({ message: `You'll now be getting ${data.responseMode} responses in this topic` })
}

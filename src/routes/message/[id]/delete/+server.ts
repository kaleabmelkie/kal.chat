import { db } from '$lib/drizzle/db.server.js'
import { messagesTable } from '$lib/drizzle/schema/messages.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { error, json } from '@sveltejs/kit'
import { and, eq, inArray } from 'drizzle-orm'

export async function DELETE(event) {
	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		error(401, 'Unauthorized')
	}

	const messageId = Number(event.params.id)
	if (typeof messageId !== 'number') {
		error(400, 'Invalid message ID param')
	}

	// await prisma.message.delete({
	// 	where: {
	// 		id: messageId,
	// 		topic: {
	// 			userId: session.user.id,
	// 		},
	// 	},
	// })

	await db
		.delete(messagesTable)
		.where(
			and(
				eq(messagesTable.id, messageId),
				inArray(
					messagesTable.topicId,
					db
						.select({ id: topicsTable.id })
						.from(topicsTable)
						.where(eq(topicsTable.userId, session.user.id)),
				),
			),
		)

	return json({ message: 'Message deleted' })
}

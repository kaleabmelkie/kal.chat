import { prisma } from '$lib/utils/prisma.server.js'
import { error, json } from '@sveltejs/kit'

export async function DELETE(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	const messageId = Number(event.params.id)
	if (typeof messageId !== 'number') {
		throw error(400, 'Invalid message ID param')
	}

	await prisma.message.delete({
		where: {
			id: messageId,
			topic: {
				userId: session.user.id,
			},
		},
	})

	return json({ message: 'Message deleted' })
}

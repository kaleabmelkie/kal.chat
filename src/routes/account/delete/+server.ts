import { prisma } from '$lib/utils/prisma.server.js'
import { error, json } from '@sveltejs/kit'

export async function DELETE(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	await prisma.user.delete({
		where: {
			id: session.user.id,
		},
	})

	return json({ message: 'Account deleted' })
}

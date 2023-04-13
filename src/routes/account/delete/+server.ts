import { prisma } from '$lib/utils/prisma.server.js'
import { error, json } from '@sveltejs/kit'

export async function DELETE(event) {
	const session = await event.locals.getSession()
	if (!session?.user?.email) {
		throw error(401, 'Unauthorized')
	}

	await prisma.user.delete({
		where: {
			email: session.user.email,
		},
	})

	return json({ message: 'Account deleted' })
}

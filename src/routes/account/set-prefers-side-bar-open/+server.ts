import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function PUT(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'Unauthorized')
	}

	const requestJson = await event.request.json()
	if (typeof requestJson?.prefersSideBarOpen !== 'boolean') {
		throw error(400, 'Bad request')
	}

	await prisma.user.update({
		where: {
			id: session.user.id,
		},
		data: {
			prefersSideBarOpen: requestJson.prefersSideBarOpen,
		},
	})

	return json({ message: 'Preferences updated' })
}

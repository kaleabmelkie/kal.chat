import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function PUT(event) {
	const session = await event.locals.getSession()
	if (!session?.user?.email) {
		throw error(401, 'Unauthorized')
	}

	const requestJson = await event.request.json()
	if (typeof requestJson?.prefersSideBarOpen !== 'boolean') {
		throw error(400, 'Bad request')
	}

	await prisma.user.update({
		where: {
			email: session.user.email,
		},
		data: {
			prefersSideBarOpen: requestJson.prefersSideBarOpen,
		},
	})

	return json({
		success: true,
	})
}

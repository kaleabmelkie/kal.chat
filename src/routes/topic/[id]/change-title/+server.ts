import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function PUT({ locals, params, request }) {
	const session = await locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, `You must be logged in to change a topic's title`)
	}

	const data = await request.json()
	if (typeof data?.title !== 'string') {
		throw error(400, 'You must provide a valid title')
	}

	await prisma.topic.update({
		where: {
			id: Number(params.id),
			userId: session.user.id,
		},
		data: {
			title: data.title,
		},
	})

	return json({ message: 'Topic title changed' })
}

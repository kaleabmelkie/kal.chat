import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function DELETE({ locals, params }) {
	const session = await locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, 'You must be logged in to delete a topic')
	}

	await prisma.topic.delete({
		where: {
			id: Number(params.id),
			userId: session.user.id,
		},
	})

	return json({ message: 'Topic deleted' })
}

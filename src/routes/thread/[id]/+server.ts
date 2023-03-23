import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function DELETE({ locals, params }) {
	const session = await locals.getSession()
	if (!session?.user?.email) {
		throw error(401, 'You must be logged in to delete a thread')
	}

	await prisma.thread.delete({
		where: {
			id: Number(params.id),
			user: {
				email: session.user.email,
			},
		},
	})

	return json({ message: 'Thread deleted' })
}

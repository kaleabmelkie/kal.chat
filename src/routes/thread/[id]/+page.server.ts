import { contextLength } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { prisma } from '$lib/utils/prisma.server'
import { error, redirect } from '@sveltejs/kit'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/thread/${event.params.id}`)}`)
	}

	const thread = await prisma.thread.findFirst({
		where: {
			id: Number(event.params.id),
			user: {
				email: session.user.email ?? 'kaleabmelkie@gmail.com',
			},
		},
		orderBy: {
			id: 'desc',
		},
		take: 1,
		include: {
			Message: {
				orderBy: {
					id: 'asc',
				},
			},
		},
	})

	if (!thread) {
		throw error(
			404,
			`Thread (ID: ${event.params.id}) not found.\n\nEither it doesn't exist or you don't have access to it.`,
		)
	}

	return {
		userAgent: event.request.headers.get('user-agent'),
		thread,
		systemPromptTokensCount: countTokens(generateSystemPrompt(session.user.name ?? undefined)),
		contextLength,
		threads: prisma.thread.findMany({
			where: { user: { email: session.user.email } },
			select: {
				id: true,
				title: true,
				updatedAt: true,
				Message: {
					select: {
						id: true,
					},
				},
			},
			orderBy: { updatedAt: 'desc' },
		}),
	}
}

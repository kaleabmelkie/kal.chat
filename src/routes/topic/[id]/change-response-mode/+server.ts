import { prisma } from '$lib/utils/prisma.server'
import type { ResponseModeType } from '@prisma/client'
import { error, json } from '@sveltejs/kit'

const responseModes: ResponseModeType[] = ['faster', 'better']

export async function PUT({ locals, params, request }) {
	const session = await locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw error(401, `You must be logged in to change a topic's response mode`)
	}

	if (typeof params.id !== 'string') {
		throw error(400, 'You must provide a topic ID')
	}

	const data = await request.json()
	if (typeof data.responseMode !== 'string') {
		throw error(400, 'You must provide a response mode')
	}
	if (!responseModes.includes(data.responseMode)) {
		throw error(400, `Response mode must be one of ${responseModes.join(', ')}`)
	}

	if (
		data.responseMode === 'better' &&
		session.user.plan === 'free' &&
		!session.user.ownOpenAiApiKey
	) {
		throw error(
			402,
			'You must either upgrade to a paid plan or provide your own OpenAI API key (in Advanced Settings) to use the better response mode',
		)
	}

	const { responseMode } = await prisma.topic.update({
		where: {
			id: Number(params.id),
			userId: session.user.id,
		},
		data: {
			responseMode: data.responseMode,
		},
	})

	return json({ message: `You'll now be getting ${responseMode} responses in this topic` })
}

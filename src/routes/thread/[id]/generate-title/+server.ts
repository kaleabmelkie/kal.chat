import { modelName } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import { error, json } from '@sveltejs/kit'

export async function PUT({ locals, params, url }) {
	const session = await locals.getSession()
	if (!session?.user?.email) {
		throw error(401, `You must be logged in to change a thread's title`)
	}

	let thread = await prisma.thread.findFirstOrThrow({
		where: {
			id: Number(params.id),
			user: {
				email: session.user.email,
			},
		},
	})

	if (thread.title && url.searchParams.get('force') !== 'true') {
		throw error(400, 'Thread already has a title')
	}

	const reversedMessages = await prisma.message.findMany({
		where: {
			role: { in: ['assistant', 'user'] },
			threadId: thread.id,
		},
		orderBy: {
			createdAt: 'desc',
		},
	})
	if (reversedMessages.length < 2) {
		throw error(400, 'Not enough messages to generate a title')
	}
	let messagesToAnalyze: typeof reversedMessages = []
	let tokensCount = 0
	for (const message of reversedMessages) {
		const currentCount = await countTokens(message.content)
		if (tokensCount + currentCount > 100) {
			break
		}
		messagesToAnalyze.push(message)
		tokensCount += currentCount
	}
	messagesToAnalyze = messagesToAnalyze.reverse()

	const chatCompletionResponse = await openai.createChatCompletion({
		model: modelName,
		messages: [
			...messagesToAnalyze.map((m) => ({ role: m.role, content: m.content })),
			{
				role: 'system',
				content: `Generate a short and accurate title for this chat conversation. Limit the title to a maximum of 5 words. Be specific within the scope of this chat. The title should describe this chat well. Respond exactly with the generated title. Do not include any other punctuation. Do not include any quotation marks and periods.${
					session.user?.name ? ` Do not include "${session.user.name.split(' ')[0]}".` : ''
				} Do not include any other text. If there are multiple topics, choose the most talked about.`, // 86 tokens (max is 96 minus the response message)
			},
		],
	})
	const newTitle = chatCompletionResponse.data.choices
		?.map((c) => c.message?.content ?? '')
		.join('')
		.replace(/Chat Title: /i, '')
		.replace(/Chat Topic: /i, '')
		.replace(/Title: /i, '')
		.replace(/Topic: /i, '')
		.replace(/"/g, '')
		.replace(/\.$/, '')
	if (!newTitle) {
		throw error(500, 'Could not generate a title')
	}

	thread = await prisma.thread.update({
		where: {
			id: Number(params.id),
			user: {
				email: session.user.email,
			},
		},
		data: {
			title: newTitle,
		},
	})

	return json({
		updatedAt: thread.updatedAt,
		title: newTitle,
	})
}

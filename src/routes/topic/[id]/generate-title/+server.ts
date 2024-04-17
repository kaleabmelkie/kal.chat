import { db } from '$lib/drizzle/db.server.js'
import { messagesTable } from '$lib/drizzle/schema/messages.server.js'
import { topicsTable } from '$lib/drizzle/schema/topics.server.js'
import { models } from '$lib/utils/constants.js'
import { countTokens } from '$lib/utils/count-tokens'
import { getOpenAiApi } from '$lib/utils/get-openai-api.server'
import { error, json } from '@sveltejs/kit'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type { CreateChatCompletionResponse } from 'openai-edge'

const maxTitleResponseTokens = 10

export async function PUT({ locals, params, url }) {
	const session = await locals.auth()
	if (typeof session?.user?.id !== 'number') {
		error(401, `You must be logged in to change a topic's title`)
	}

	const topic = await db.query.topicsTable.findFirst({
		where: and(eq(topicsTable.id, Number(params.id)), eq(topicsTable.userId, session.user.id)),
	})
	if (!topic) {
		error(404, 'Topic not found')
	}

	if (topic.title && url.searchParams.get('force') !== 'true') {
		error(400, 'Topic already has a title')
	}

	const prompt = `Generate a short title for this chat conversation. Limit the title to a absolute maximum of just 48 characters. Be specific within the scope of this chat. The title should describe this chat well. Respond exactly with the generated title. Do not include any other punctuation. Do not label the title. Do not mention the characters length or limit. Do not include any quotation marks and periods.${
		session.user?.name ? ` Do not mention the user's name (i.e. "${session.user.name}").` : ''
	} Do not include any other text. If there are multiple topics, choose the most talked about.`
	const promptTokens = await countTokens(prompt)

	const model = models.find((m) => m.responseMode === 'faster')
	if (!model) {
		error(400, `Unsupported responseMode: faster`)
	}

	const reversedMessages = await db.query.messagesTable.findMany({
		where: and(
			inArray(messagesTable.role, ['assistant', 'user']),
			eq(messagesTable.topicId, topic.id),
		),
		orderBy: desc(messagesTable.createdAt),
	})
	if (reversedMessages.length < 2) {
		error(400, 'Not enough messages to generate a title')
	}
	let messagesToAnalyze: typeof reversedMessages = []
	let tokensCount = 0
	for (const message of reversedMessages) {
		const currentCount = await countTokens(message.content)
		if (tokensCount + currentCount > model.maxModelTokens - promptTokens - maxTitleResponseTokens) {
			break
		}
		messagesToAnalyze.push(message)
		tokensCount += currentCount
	}
	messagesToAnalyze = messagesToAnalyze.reverse()

	const openAiApi = getOpenAiApi(session.user.ownOpenaiApiKey ?? null)

	const chatCompletionResponse: CreateChatCompletionResponse = await (
		await openAiApi.createChatCompletion({
			model: model.name,
			messages: [
				...messagesToAnalyze.map((m) => ({ role: m.role, content: m.content })),
				{
					role: 'system',
					content: prompt,
				},
			],
			max_tokens: maxTitleResponseTokens,
			n: 1,
			stream: false,
		})
	).json()
	const newTitle = chatCompletionResponse.choices
		?.map((c) => c.message?.content ?? '')
		.join('')
		.replace(/Chat Intro: /i, '')
		.replace(/Chat Name: /i, '')
		.replace(/Chat Title: /i, '')
		.replace(/Chat Topic: /i, '')
		.replace(/Title: /i, '')
		.replace(/Topic: /i, '')
		.replace(/"/g, '')
		.replace(/\.$/, '')
		.replace(/\(\d+ characters\)$/, '')
		.replace(/\(Limit: \d+ characters\)$/, '')
		.trim()
		.substring(0, 64)
	if (!newTitle) {
		error(500, 'Could not generate a title')
	}

	const [updatedTopic] = await db
		.update(topicsTable)
		.set({
			updatedAt: new Date(),
			title: newTitle,
		})
		.where(and(eq(topicsTable.id, topic.id), eq(topicsTable.userId, session.user.id)))
		.returning({
			updatedAt: topicsTable.updatedAt,
		})

	return json({
		updatedAtStr: updatedTopic.updatedAt.toISOString(),
		title: newTitle,
	})
}

import { db } from '$lib/drizzle/db.server.js'
import { messagesTable } from '$lib/drizzle/schema/messages.server.js'
import {
	topicsTable,
	updateTopicSchema,
	type UpdateTopic,
} from '$lib/drizzle/schema/topics.server.js'
import { models } from '$lib/utils/constants.js'
import { countTokens } from '$lib/utils/count-tokens'
import { getGroq } from '$lib/utils/get-groq.server.js'
import { error, json } from '@sveltejs/kit'
import { and, desc, eq, inArray } from 'drizzle-orm'

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

	const promptTokens = await countTokens(getPrompt([]))

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

	function getPrompt(messages: typeof messagesToAnalyze) {
		return `Summarize the following conversation in 4 words max as a title:

[START OF CONVERSATION]

${messages.map((m, i) => `${i === 0 ? '' : '---\n'}${m.content}\n`).join('\n')}

[END OF CONVERSATION]



Conversation Title: `
	}

	const groq = getGroq(session.user.ownOpenaiApiKey ?? null)

	const chatCompletionResponse = await groq.chat.completions.create({
		model: model.name,
		messages: [
			{
				role: 'system',
				content: getPrompt(messagesToAnalyze),
			},
		],
		max_tokens: maxTitleResponseTokens,
		n: 1,
		stream: false,
	})

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
		.set(
			updateTopicSchema.parse({
				updatedAt: new Date(),
				title: newTitle,
			} satisfies UpdateTopic) satisfies UpdateTopic,
		)
		.where(and(eq(topicsTable.id, topic.id), eq(topicsTable.userId, session.user.id)))
		.returning({
			updatedAt: topicsTable.updatedAt,
		})

	return json({
		updatedAtStr: updatedTopic.updatedAt.toISOString(),
		title: newTitle,
	})
}

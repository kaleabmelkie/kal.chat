import type { NewMessageOkResponseBody } from '$lib/types/new-message-types.js'
import { maxTokensForUser, messagesCountInContext, modelName } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { markdownToHtml } from '$lib/utils/markdown-to-html.server.js'
import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import { error, json, redirect } from '@sveltejs/kit'
import type { ChatCompletionRequestMessage } from 'openai'

export async function POST(event) {
	const data = await event.request.json()

	if (!data.topicId || typeof data.topicId !== 'number') {
		throw error(400, `Invalid topicId: ${data.topicId}`)
	}
	if (!data.message || typeof data.message !== 'string') {
		throw error(400, `Invalid message: ${data.message}`)
	}
	if (!data.message.trim()) {
		throw error(400, `Empty message`)
	}

	const session = await event.locals.getSession()
	if (!session?.user?.email) {
		throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/topic/${data.topicId}`)}`)
	}

	const oldMessages = (
		await prisma.message.findMany({
			where: {
				role: { in: ['assistant', 'user'] },
				topic: {
					id: data.topicId,
					user: {
						email: session.user.email,
					},
				},
			},
			take: messagesCountInContext,
			orderBy: {
				id: 'desc',
			},
		})
	).reverse()

	const systemPrompt = generateSystemPrompt(session.user.name ?? undefined)

	const recentRequestMessages: ChatCompletionRequestMessage[] = [
		{ role: 'system', content: systemPrompt },
		...oldMessages.map((m) => ({ role: m.role, content: m.content })),
		{ role: 'user', content: data.message },
	]

	let tokenCount = await countTokens(systemPrompt)
	for (const message of recentRequestMessages) {
		tokenCount += await countTokens(message.content)
	}
	if (tokenCount > maxTokensForUser) {
		throw error(413, 'Too many tokens')
	}

	const moderationResponse = await openai.createModeration({
		input: data.message,
	})
	if (moderationResponse.data.results.find((result) => result.flagged)) {
		throw error(400, 'Message flagged by OpenAI')
	}

	const chatCompletionResponse = await openai.createChatCompletion({
		model: modelName,
		messages: recentRequestMessages,
		n: 1,
		stream: false,
	})

	const [{ count: newMessagesCount }, topic] = await Promise.all([
		prisma.message.createMany({
			data: [
				{
					role: 'user',
					content: data.message,
					topicId: data.topicId,
				},
				// new messages:
				...chatCompletionResponse.data.choices
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((c) => c.message!)
					.filter((m) => !!m)
					.map((m) => ({
						role: m.role,
						content: m.content,
						topicId: data.topicId,
					})),
			],
		}),

		prisma.topic.update({
			where: {
				id: data.topicId,
			},
			data: {
				updatedAt: new Date(),
			},
		}),
	])

	const newMessages = await prisma.message.findMany({
		where: {
			topic: {
				id: data.topicId,
				user: {
					email: session.user.email,
				},
			},
		},
		orderBy: { id: 'desc' },
		take: newMessagesCount,
		select: { id: true, role: true, content: true },
	})

	return json({
		newMessages: newMessages.reverse().map((m) => ({
			id: m.id,
			role: m.role,
			content: markdownToHtml(m.content),
		})),

		topicHistoryUpdatedAtIso: topic.updatedAt.toISOString(),
	} satisfies NewMessageOkResponseBody)
}

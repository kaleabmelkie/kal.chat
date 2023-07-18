import type { NewMessageOkResponseBody } from '$lib/types/message.js'
import { messagesCountInContext, models } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { markdownToHtml } from '$lib/utils/markdown-to-html.server.js'
import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import type { RoleType } from '@prisma/client'
import { error, json, redirect } from '@sveltejs/kit'
import type {
	ChatCompletionRequestMessage,
	CreateChatCompletionResponse,
	CreateModerationResponse,
} from 'openai-edge'

export async function POST(event) {
	const { topicId, message } = await event.request.json()

	if (typeof topicId !== 'number') {
		throw error(400, `Invalid topicId: ${topicId}`)
	}
	if (typeof message !== 'string') {
		throw error(400, `Invalid message: ${message}`)
	}
	if (!message.trim()) {
		throw error(400, `Empty message`)
	}

	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/topic/${topicId}`)}`)
	}

	let { responseMode: responseMode } = await prisma.topic.findFirstOrThrow({
		where: {
			id: topicId,
		},
		select: {
			responseMode: true,
		},
	})
	if (responseMode === 'better' && session.user.plan === 'free') {
		const { responseMode: _responseMode } = await prisma.topic.update({
			where: {
				id: topicId,
			},
			data: {
				responseMode: 'faster',
			},
		})
		responseMode = _responseMode
	}

	const model = models.find((m) => m.responseMode === responseMode)
	if (!model) {
		throw error(400, `Unsupported responseMode: ${responseMode}`)
	}

	const oldMessages = (
		await prisma.message.findMany({
			where: {
				role: { in: ['assistant', 'user'] },
				topic: {
					id: topicId,
					userId: session.user.id,
				},
			},
			select: {
				role: true,
				content: true,
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
		{ role: 'user', content: message },
	]

	let tokenCount = await countTokens(systemPrompt)
	for (const requestMessage of recentRequestMessages) {
		tokenCount += await countTokens(requestMessage.content ?? '')
	}
	if (tokenCount > model.maxRequestTokens) {
		throw error(413, 'Too many tokens')
	}

	const moderationResponse: CreateModerationResponse = await (
		await openai.createModeration({
			input: message,
		})
	).json()
	if (moderationResponse.results.find((result) => result.flagged)) {
		throw error(400, 'Message flagged by OpenAI')
	}

	const chatCompletionResponse: CreateChatCompletionResponse = await (
		await openai.createChatCompletion({
			model: model.name,
			messages: recentRequestMessages,
			max_tokens: model.maxResponseTokens,
			n: 1,
			stream: false,
		})
	).json()

	const [{ count: newMessagesCount }, topic] = await Promise.all([
		prisma.message.createMany({
			data: [
				{
					role: 'user',
					content: message,
					topicId: topicId,
				},
				// new messages:
				...chatCompletionResponse.choices
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((c) => c.message!)
					.filter((m) => !!m?.content)
					.map((m) => ({
						role: m.role as RoleType,
						content: m.content as string,
						topicId: topicId,
					})),
			],
		}),

		prisma.topic.update({
			where: {
				id: topicId,
			},
			data: {
				updatedAt: new Date(),
			},
			select: {
				id: true,
				title: true,
				updatedAt: true,
			},
		}),
	])

	const newMessages = await prisma.message.findMany({
		where: {
			topic: {
				id: topicId,
				userId: session.user.id,
			},
		},
		orderBy: { id: 'desc' },
		take: newMessagesCount,
		select: { id: true, role: true, content: true },
	})

	if (!topic.title) {
		const generateTitleResponse = (await (
			await event.fetch(`/topic/${topic.id}/generate-title?force=false`, {
				method: 'PUT',
			})
		).json()) as { title: string; updatedAt: string }

		const updatedTopic = await prisma.topic.update({
			where: {
				id: topicId,
			},
			data: {
				title: generateTitleResponse.title,
			},
		})
		topic.updatedAt = updatedTopic.updatedAt
		topic.title = updatedTopic.title
	}

	return json({
		newMessages: newMessages.reverse().map((m) => ({
			id: m.id,
			role: m.role,
			content: markdownToHtml(m.content),
		})),
		topicTitle: topic.title,
		topicHistoryUpdatedAtIso: topic.updatedAt.toISOString(),
	} satisfies NewMessageOkResponseBody)
}

import { contextLength, maxTokensForUser, modelName } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import { transformMessage } from '$lib/utils/transform-message.server'
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
			take: contextLength,
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

	await Promise.all([
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

	const [topic, topics] = await Promise.all([
		prisma.topic.findFirstOrThrow({
			where: {
				id: Number(event.params.id),
				user: {
					email: session.user.email,
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
		}),

		prisma.topic.findMany({
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
	])

	return json({
		topic: await (async () => ({
			...topic,
			Message: await Promise.all(
				topic.Message.map(async (m) => ({
					...m,
					content: await transformMessage(m.content),
				})),
			),
		}))(),
		topics,
	})
}
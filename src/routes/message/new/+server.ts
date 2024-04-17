import { db } from '$lib/drizzle/db.server.js'
import {
	insertMessageSchema,
	messagesTable,
	type InsertMessage,
} from '$lib/drizzle/schema/messages.server.js'
import {
	topicsTable,
	updateTopicSchema,
	type UpdateTopic,
} from '$lib/drizzle/schema/topics.server.js'
import type { NewMessageOkResponseBody } from '$lib/types/message.js'
import { messagesCountInContext, models } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { getOpenAiApi } from '$lib/utils/get-openai-api.server'
import { markdownToHtml } from '$lib/utils/markdown-to-html.server.js'
import { error, json, redirect } from '@sveltejs/kit'
import { and, desc, eq, inArray } from 'drizzle-orm'
import type {
	ChatCompletionRequestMessage,
	CreateChatCompletionResponse,
	CreateModerationResponse,
} from 'openai-edge'

export async function POST(event) {
	const { topicId, message } = await event.request.json()

	if (typeof topicId !== 'number') {
		error(400, `Invalid topicId: ${topicId}`)
	}
	if (typeof message !== 'string') {
		error(400, `Invalid message: ${message}`)
	}
	if (!message.trim()) {
		error(400, `Empty message`)
	}

	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		redirect(302, `/account?redirectTo=${encodeURIComponent(`/topic/${topicId}`)}`)
	}

	const topic = await db.query.topicsTable.findFirst({
		where: eq(topicsTable.id, topicId),
		columns: {
			responseMode: true,
		},
	})
	if (!topic) {
		error(404, 'Topic not found')
	}
	let responseMode = topic.responseMode
	if (responseMode === 'better' && session.user.plan === 'free') {
		await db
			.update(topicsTable)
			.set(
				updateTopicSchema.parse({
					updatedAt: new Date(),
					responseMode: 'faster',
				} satisfies UpdateTopic) satisfies UpdateTopic,
			)
			.where(eq(topicsTable.id, topicId))
		responseMode = 'faster'
	}

	const model = models.find((m) => m.responseMode === responseMode)
	if (!model) {
		error(400, `Unsupported responseMode: ${responseMode}`)
	}

	const oldMessages = (
		await db
			.select({
				role: messagesTable.role,
				content: messagesTable.content,
			})
			.from(messagesTable)
			.leftJoin(topicsTable, eq(messagesTable.topicId, topicsTable.id))
			.where(
				and(
					inArray(messagesTable.role, ['assistant', 'user']),
					eq(messagesTable.topicId, topicId),
					eq(topicsTable.userId, session.user.id),
				),
			)
			.orderBy(desc(messagesTable.id))
			.limit(messagesCountInContext)
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
		error(413, 'Too many tokens')
	}

	const openAiApi = getOpenAiApi(session.user.ownOpenaiApiKey ?? null)

	const moderationResponse: CreateModerationResponse = await (
		await openAiApi.createModeration({
			input: message,
		})
	).json()
	if (moderationResponse.results.find((result) => result.flagged)) {
		error(400, 'Message flagged by OpenAI')
	}

	const chatCompletionResponse: CreateChatCompletionResponse = await (
		await openAiApi.createChatCompletion({
			model: model.name,
			messages: recentRequestMessages,
			max_tokens: model.maxResponseTokens,
			n: 1,
			stream: false,
		})
	).json()

	const now = new Date()

	const [{ rowsAffected: newMessagesCount }, [updatedTopic]] = await Promise.all([
		db.insert(messagesTable).values(
			[
				{
					createdAt: now,
					updatedAt: now,
					role: 'user',
					content: message,
					topicId: topicId,
				} satisfies InsertMessage,
				// new messages:
				...chatCompletionResponse.choices
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((c) => c.message!)
					.filter((m) => !!m?.content)
					.map(
						(m) =>
							({
								createdAt: now,
								updatedAt: now,
								role: m.role as InsertMessage['role'],
								content: m.content as string,
								topicId: topicId,
							}) satisfies InsertMessage,
					),
			].map((v) => insertMessageSchema.parse(v)) satisfies InsertMessage[],
		),

		db
			.update(topicsTable)
			.set(
				updateTopicSchema.parse({
					updatedAt: new Date(),
				} satisfies UpdateTopic) satisfies UpdateTopic,
			)
			.where(eq(topicsTable.id, topicId))
			.returning({
				id: topicsTable.id,
				title: topicsTable.title,
				updatedAt: topicsTable.updatedAt,
			}),
	])

	const newMessages = await db
		.select({
			id: messagesTable.id,
			role: messagesTable.role,
			content: messagesTable.content,
		})
		.from(messagesTable)
		.leftJoin(topicsTable, eq(messagesTable.topicId, topicsTable.id))
		.where(and(eq(messagesTable.topicId, topicId), eq(topicsTable.userId, session.user.id)))
		.orderBy(desc(messagesTable.id))
		.limit(newMessagesCount)

	if (!updatedTopic.title) {
		const generateTitleResponse = (await (
			await event.fetch(`/topic/${updatedTopic.id}/generate-title?force=false`, {
				method: 'PUT',
			})
		).json()) as { title: string; updatedAtStr: string }

		const [updatedTopic2] = await db
			.update(topicsTable)
			.set(
				updateTopicSchema.parse({
					updatedAt: new Date(generateTitleResponse.updatedAtStr),
					title: generateTitleResponse.title,
				} satisfies UpdateTopic) satisfies UpdateTopic,
			)
			.where(eq(topicsTable.id, topicId))
			.returning({
				updatedAt: topicsTable.updatedAt,
				title: topicsTable.title,
			})
		updatedTopic.updatedAt = updatedTopic2.updatedAt
		updatedTopic.title = updatedTopic2.title
	}

	return json({
		newMessages: await Promise.all(
			newMessages.reverse().map(async (m) => ({
				id: m.id,
				role: m.role,
				content: await markdownToHtml(m.content),
			})),
		),
		topicTitle: updatedTopic.title,
		topicHistoryUpdatedAtIso: updatedTopic.updatedAt.toISOString(),
	} satisfies NewMessageOkResponseBody)
}

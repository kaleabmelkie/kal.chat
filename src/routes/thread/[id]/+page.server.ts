import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import { error, redirect } from '@sveltejs/kit'
import type { ChatCompletionRequestMessage } from 'openai'

const modelName = 'gpt-3.5-turbo' as const
const maxTokens = 4000 as const
const contextLength = 9 as const

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
		topics: prisma.thread.findMany({
			where: { user: { email: session.user.email } },
			select: { id: true, title: true, updatedAt: true },
			orderBy: { updatedAt: 'desc' },
		}),
	}
}

export const actions = {
	newMessage: async (event) => {
		const formData = await event.request.formData()

		const threadId = Number(formData.get('threadId')?.toString())
		if (!threadId || typeof threadId !== 'number') {
			throw error(400, `Invalid threadId: ${threadId}`)
		}
		const message = formData.get('message')?.toString()
		if (!message || typeof message !== 'string') {
			throw error(400, `Invalid message: ${message}`)
		}

		const session = await event.locals.getSession()
		if (!session?.user?.email) {
			throw redirect(302, `/account?redirectTo=${encodeURIComponent(`/thread/${threadId}`)}`)
		}

		const oldMessages = (
			await prisma.message.findMany({
				where: {
					role: { in: ['assistant', 'user'] },
					thread: {
						id: threadId,
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
			{ role: 'user', content: message },
		]

		let tokenCount = await countTokens(systemPrompt)
		for (const message of recentRequestMessages) {
			tokenCount += await countTokens(message.content)
		}
		if (tokenCount > maxTokens) {
			throw error(413, 'Too many tokens')
		}

		const moderationResponse = await openai.createModeration({
			input: message,
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

		await prisma.message.createMany({
			data: [
				{
					role: 'user',
					content: message,
					threadId,
				},
				// new messages:
				...chatCompletionResponse.data.choices
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					.map((c) => c.message!)
					.filter((m) => !!m)
					.map((m) => ({
						role: m.role,
						content: m.content,
						threadId,
					})),
			],
		})

		return {
			thread: await prisma.thread.findFirstOrThrow({
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
		}
	},
}

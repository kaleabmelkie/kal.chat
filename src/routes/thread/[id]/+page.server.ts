import { openai } from '$lib/utils/openai.server'
import { prisma } from '$lib/utils/prisma.server'
import { systemPrompt } from '$lib/utils/system-prompt'
import { countTokens } from '$lib/utils/tokenizer'
import { error, redirect } from '@sveltejs/kit'
import type { ChatCompletionRequestMessage } from 'openai'

export const load = async (event) => {
	const { session } = await event.parent()
	if (!session?.user?.email) {
		throw redirect(302, `/login?redirectTo=/thread/${event.params.id}`)
	}

	return {
		userAgent: event.request.headers.get('user-agent'),
		thread: prisma.thread.findFirstOrThrow({
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
			throw redirect(302, `/login?redirectTo=/thread/${threadId}`)
		}

		const oldMessages = (
			await prisma.message.findMany({
				where: {
					thread: {
						id: threadId,
						user: {
							email: session.user.email,
						},
					},
				},
				take: 9,
				orderBy: {
					id: 'desc',
				},
			})
		).reverse()

		const recentRequestMessages: ChatCompletionRequestMessage[] = [
			...oldMessages.map((m) => ({ role: m.role, content: m.content })),
			{ role: 'user', content: message },
		]

		let tokenCount = countTokens(systemPrompt)
		for (const message of recentRequestMessages) {
			tokenCount += countTokens(message.content)
		}
		if (tokenCount > 4096) {
			throw error(413, 'Too many tokens')
		}

		const moderationResponse = await openai.createModeration({
			input: message,
		})
		if (moderationResponse.data.results.find((result) => result.flagged)) {
			throw error(400, 'Message flagged by OpenAI')
		}

		const chatCompletionResponse = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: recentRequestMessages,
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

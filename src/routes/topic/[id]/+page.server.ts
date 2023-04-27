import type { ChatStoreType } from '$lib/stores/chat-store.js'
import { messagesCountInContext } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { markdownToHtml } from '$lib/utils/markdown-to-html.server.js'
import { prisma } from '$lib/utils/prisma.server'
import { error, redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()
	if (typeof session?.user.id !== 'number') {
		throw redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const [systemPromptTokensCount, loggedInUser, topicsHistory, activeTopic] = await Promise.all([
		// systemPromptTokensCountPromise
		countTokens(generateSystemPrompt(session.user.name ?? undefined)),

		// loggedInUserPromise
		prisma.user.findFirstOrThrow({
			where: {
				id: session.user.id,
			},
			select: {
				prefersSideBarOpen: true,
			},
		}),

		// topicsHistoryPromise
		prisma.topic.findMany({
			where: {
				userId: session.user.id,
			},
			select: {
				id: true,
				title: true,
				updatedAt: true,
				Message: {
					where: {
						role: { not: 'system' },
					},
					select: {
						id: true,
					},
				},
			},
			orderBy: {
				updatedAt: 'desc',
			},
		}),

		// activeTopic
		await prisma.topic.findFirst({
			where: {
				id: Number(event.params.id),
				userId: session.user.id,
			},
			orderBy: {
				updatedAt: 'desc',
			},
			select: {
				id: true,
				Message: {
					orderBy: {
						createdAt: 'asc',
					},
					select: {
						id: true,
						role: true,
						content: true,
					},
				},
			},
		}),
	])

	if (!activeTopic) {
		throw error(
			404,
			`Topic (ID: ${event.params.id}) not found.\n\nEither it doesn't exist or you don't have access to it.`,
		)
	}

	return {
		activeTopic: {
			id: activeTopic.id,
			messages: activeTopic.Message.map((m) => ({
				...m,
				content: markdownToHtml(m.content),
			})),
			newMessage: {
				queue: [],
				content: '',
				isVoiceTyping: false,
			},
			systemPromptTokensCount: systemPromptTokensCount,
			messagesCountInContext: messagesCountInContext,
			tokensCountInContext: 0,
		},
		newTopic: {
			isCreating: false,
		},
		sideBar: {
			isOpen: false,
			prefersOpen: loggedInUser.prefersSideBarOpen,
		},
		topicsHistory: topicsHistory.map((t) => ({
			id: t.id,
			updatedAt: t.updatedAt,
			title: t.title,
			messagesCount: t.Message.length,
		})),
		window: {
			innerWidth: 0,
			innerHeight: 0,
			userAgentFromHeader: event.request.headers.get('user-agent'),
		},
	} satisfies ChatStoreType
}

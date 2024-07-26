import { db } from '$lib/drizzle/db.server.js'
import { messagesTable } from '$lib/drizzle/schema/messages.server.js'
import {
	topicsTable,
	updateTopicSchema,
	type UpdateTopic,
} from '$lib/drizzle/schema/topics.server.js'
import { usersTable } from '$lib/drizzle/schema/users.server.js'
import type { ChatStoreType } from '$lib/stores/chat-store.js'
import { messagesCountInContext } from '$lib/utils/constants'
import { countTokens } from '$lib/utils/count-tokens'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { markdownToHtml } from '$lib/utils/markdown-to-html.server.js'
import { error, redirect } from '@sveltejs/kit'
import { and, asc, desc, eq, not } from 'drizzle-orm'

export async function load(event) {
	const { browser, session } = await event.parent()
	if (typeof session?.user?.id !== 'number') {
		redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const [systemPromptTokensCount, loggedInUser, topicsHistory, activeTopic] = await Promise.all([
		// systemPromptTokensCountPromise
		countTokens(generateSystemPrompt(session.user.name ?? undefined)),

		// loggedInUserPromise
		db.query.usersTable.findFirst({
			where: eq(usersTable.id, session.user.id),
			columns: {
				prefersSideBarOpen: true,
			},
		}),

		// topicsHistoryPromise
		db.query.topicsTable.findMany({
			where: eq(topicsTable.userId, session.user.id),
			columns: {
				id: true,
				title: true,
				updatedAt: true,
			},
			with: {
				messages: {
					where: not(eq(messagesTable.role, 'system')),
					columns: {
						id: true,
					},
				},
			},
		}),

		// activeTopic
		await db.query.topicsTable.findFirst({
			where: and(
				eq(topicsTable.id, Number(event.params.id)),
				eq(topicsTable.userId, session.user.id),
			),
			orderBy: [desc(topicsTable.updatedAt)],
			columns: {
				id: true,
				responseMode: true,
			},
			with: {
				messages: {
					orderBy: [asc(messagesTable.createdAt)],
					columns: {
						id: true,
						role: true,
						content: true,
					},
				},
			},
		}),
	])

	if (!loggedInUser) {
		redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	if (!activeTopic) {
		error(
			404,
			`Topic (ID: ${event.params.id}) not found.\n\nEither it doesn't exist or you don't have access to it.`,
		)
	}

	if (activeTopic.responseMode === 'better' && session.user.plan === 'free') {
		await db
			.update(topicsTable)
			.set(
				updateTopicSchema.parse({
					updatedAt: new Date(),
					responseMode: 'faster',
				} satisfies UpdateTopic) satisfies UpdateTopic,
			)
			.where(eq(topicsTable.id, activeTopic.id))
		activeTopic.responseMode = 'faster'
	}

	return {
		activeTopic: {
			id: activeTopic.id,
			responseMode: activeTopic.responseMode,
			messages: await Promise.all(
				activeTopic.messages.map(async (m) => ({
					...m,
					content: await markdownToHtml(m.content),
				})),
			),
			newMessage: {
				queue: [],
				content: '',
			},
			systemPromptTokensCount: systemPromptTokensCount,
			messagesCountInContext: messagesCountInContext,
			tokensCountInContext: 0,
		},

		browser,

		newTopic: {
			isCreating: false,
		},

		sideBar: {
			isOpen: browser.isDesktop ? (loggedInUser.prefersSideBarOpen ?? false) : false,
			prefersOpen: loggedInUser.prefersSideBarOpen ?? false,
		},

		topicsHistory: topicsHistory.map((t) => ({
			id: t.id,
			updatedAt: t.updatedAt,
			title: t.title,
			messagesCount: t.messages.length,
		})),

		window: {
			innerWidth: 0,
			innerHeight: 0,
		},
	} satisfies Omit<ChatStoreType, 'session'>
}

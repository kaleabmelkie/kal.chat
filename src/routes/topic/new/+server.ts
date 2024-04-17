import { db } from '$lib/drizzle/db.server.js'
import {
	insertMessageSchema,
	messagesTable,
	type InsertMessage,
} from '$lib/drizzle/schema/messages.server.js'
import {
	insertTopicSchema,
	topicsTable,
	type InsertTopic,
} from '$lib/drizzle/schema/topics.server.js'
import { generateGreeting } from '$lib/utils/generate-greeting.server'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { error, redirect } from '@sveltejs/kit'

export async function GET(event) {
	const session = await event.locals.auth()
	if (typeof session?.user?.id !== 'number') {
		redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const q = event.url.searchParams.get('q') || null

	let topicId: number | null = null

	await db.transaction(async (tx) => {
		const now = new Date()

		const topics = await tx
			.insert(topicsTable)
			.values(
				insertTopicSchema.parse({
					createdAt: now,
					updatedAt: now,
					userId: session.user.id,
				} satisfies InsertTopic) satisfies InsertTopic,
			)
			.returning({
				id: topicsTable.id,
			})
		topicId = topics[0]?.id ?? null
		if (topicId === null) {
			error(500, 'Failed to create topic')
		}

		await tx.insert(messagesTable).values(
			[
				{
					createdAt: now,
					updatedAt: now,
					topicId,
					role: 'system' as const,
					content: generateSystemPrompt(session.user.name ?? undefined),
				} satisfies InsertMessage,
				q
					? (null as unknown as InsertMessage)
					: ({
							createdAt: now,
							updatedAt: now,
							topicId,
							role: 'assistant' as const,
							content: generateGreeting(session.user.name ?? 'pal'),
						} satisfies InsertMessage),
			]
				.filter((v) => v !== null)
				.map((v) => insertMessageSchema.parse(v)) satisfies InsertMessage[],
		)
	})

	redirect(302, `/topic/${topicId}${q ? `?q=${encodeURIComponent(q)}` : ''}`)
}

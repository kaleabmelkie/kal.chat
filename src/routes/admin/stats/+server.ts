import { db } from '$lib/drizzle/db.server'
import { messagesTable } from '$lib/drizzle/schema/messages.server'
import { topicsTable } from '$lib/drizzle/schema/topics.server'
import { usersTable } from '$lib/drizzle/schema/users.server'
import { json } from '@sveltejs/kit'
import { count } from 'drizzle-orm'

export async function GET() {
	const [userCountGroupedByPlan, topicCount, messageCount] = await Promise.all([
		db.select({ count: count() }).from(usersTable).groupBy(usersTable.plan),
		db.select({ count: count() }).from(topicsTable),
		db.select({ count: count() }).from(messagesTable),
	])

	return json({
		userCount: userCountGroupedByPlan,
		topicCount: topicCount[0].count,
		messageCount: messageCount[0].count,
	})
}

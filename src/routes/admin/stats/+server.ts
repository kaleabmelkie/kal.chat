import { prisma } from '$lib/utils/prisma.server'
import { json } from '@sveltejs/kit'

export async function GET() {
	const [userCountGroupedByPlan, topicCount, messageCount] = await Promise.all([
		prisma.user.groupBy({
			by: ['plan'],
			_count: true,
		}),
		prisma.topic.count(),
		prisma.message.count(),
	])

	return json({
		userCount: userCountGroupedByPlan,
		topicCount,
		messageCount,
	})
}

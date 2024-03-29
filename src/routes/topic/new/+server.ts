import { generateGreeting } from '$lib/utils/generate-greeting.server'
import { generateSystemPrompt } from '$lib/utils/generate-system-prompt.server'
import { prisma } from '$lib/utils/prisma.server'
import type { RoleType } from '@prisma/client'
import { redirect } from '@sveltejs/kit'

export async function GET(event) {
	const session = await event.locals.getSession()
	if (typeof session?.user.id !== 'number') {
		throw redirect(
			302,
			`/account?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`,
		)
	}

	const q = event.url.searchParams.get('q') || null

	const topic = await prisma.topic.create({
		data: {
			user: {
				connect: {
					id: session.user.id,
				},
			},
			Message: {
				createMany: {
					data: [
						{
							role: 'system' as const,
							content: generateSystemPrompt(session.user.name ?? undefined),
						},
						q
							? (null as unknown as { role: RoleType; content: string })
							: {
									role: 'assistant' as const,
									content: generateGreeting(session.user.name ?? 'pal'),
							  },
					].filter((d) => d !== null),
				},
			},
		},
	})

	throw redirect(302, `/topic/${topic.id}${q ? `?q=${encodeURIComponent(q)}` : ''}`)
}

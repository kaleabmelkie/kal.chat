import { LEMON_SQUEEZY_BASE_URL, LEMON_SQUEEZY_VARIANT_ID } from '$env/static/private'
import { prisma } from '$lib/utils/prisma.server'
import { error, redirect } from '@sveltejs/kit'

/**
 * @deprecated // TODO: Remove this if it has no use in the near future. It has been replaced by lemon.js in the front-end.
 */
export async function GET({ locals }) {
	const session = await locals.getSession()
	if (!session?.user?.email) {
		throw error(401, { message: 'You must be logged in to subscribe' })
	}

	const user = await prisma.user.findFirst({
		where: { email: session.user.email },
	})
	if (!user) {
		throw error(404, { message: 'User not found based on session email' })
	}

	if (user.plan !== 'free') {
		throw error(400, { message: 'User needs to be on the free plan to subscribe' })
	}

	throw redirect(
		302,
		`${LEMON_SQUEEZY_BASE_URL}/checkout/buy/${LEMON_SQUEEZY_VARIANT_ID}?checkout[email]=${
			session.user.email
		}&checkout[name]=${session.user.name ?? ''}`,
	)
}

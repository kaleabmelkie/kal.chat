import { redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()

	const redirectTo = event.url.searchParams.get('redirectTo') || null

	if (session?.user?.email && redirectTo !== null) {
		throw redirect(302, redirectTo)
	}

	return {
		redirectTo: redirectTo ?? '/',
	}
}

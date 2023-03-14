import { authHookConfig } from '$lib/utils/auth-hook.server'
import { redirect } from '@sveltejs/kit'

export async function load(event) {
	const { session } = await event.parent()

	const redirectTo = event.url.searchParams.get('redirectTo') || null

	if (session?.user?.email && redirectTo !== null) {
		throw redirect(302, redirectTo)
	}

	return {
		providers: authHookConfig.providers.map((p) => ({
			id: p.id,
			name: p.name,
			type: p.type,
		})),
		redirectTo: redirectTo ?? '/',
	}
}

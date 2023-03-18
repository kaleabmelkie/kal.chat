import { secureAdminRoutes } from '$lib/hooks/secure-admin-routes'
import { authHook } from '$lib/utils/auth-hook.server'
import { sequence } from '@sveltejs/kit/hooks'

export const handle = sequence(secureAdminRoutes, authHook)

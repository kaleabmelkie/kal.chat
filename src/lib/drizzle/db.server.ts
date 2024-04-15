import { TURSO_AUTH_TOKEN, TURSO_DATABASE_URL } from '$env/static/private'
import * as messagesSchema from '$lib/drizzle/schema/messages.server'
import * as topicsSchema from '$lib/drizzle/schema/topics.server'
import * as usersSchema from '$lib/drizzle/schema/users.server'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

export const libsqlClient = createClient({
	url: TURSO_DATABASE_URL,
	authToken: TURSO_AUTH_TOKEN,
})

export const db = drizzle(libsqlClient, {
	schema: {
		...messagesSchema,
		...topicsSchema,
		...usersSchema,
	},
})

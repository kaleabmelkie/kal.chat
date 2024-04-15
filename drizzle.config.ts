import type { Config } from 'drizzle-kit'

const dbUrl = process.env.TURSO_DATABASE_URL
if (!dbUrl) {
	throw new Error('TURSO_DATABASE_URL is not set')
}

export default {
	schema: './src/lib/drizzle/schema/*.ts',
	driver: 'turso',
	dbCredentials: {
		url: dbUrl,
		authToken: process.env.TURSO_AUTH_TOKEN!,
	},
	verbose: true,
	strict: true,
} satisfies Config

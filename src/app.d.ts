import type { UserPlanType } from '@prisma/client'

declare global {
	namespace App {
		interface Error {
			message: string
		}

		// interface Locals {}

		// interface PageData {}

		// interface Platform {}
	}
}

declare module '@auth/core/types' {
	interface Session {
		user: {
			id: number
			name: string
			email: string
			image?: string | null
			plan: UserPlanType
			ownOpenAiApiKey?: string | null
		}
	}
}

export {}

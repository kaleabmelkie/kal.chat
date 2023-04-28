import type { Session } from '@auth/core/types'
import type { UserPlanType } from '@prisma/client'

type EnhancedSessionType = Session & {
	user: {
		id: number
		name: string
		email: string
		image?: string | null
		plan: UserPlanType
	}
}

declare global {
	namespace App {
		interface Error {
			message: string
		}

		interface Locals {
			getSession(): Promise<EnhancedSessionType | null>
		}

		interface PageData {
			session: EnhancedSessionType | null
		}

		// interface Platform {}
	}
}

export {}

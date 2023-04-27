import type { Session } from '@auth/core/types'
import type { UserPlanType } from '@prisma/client'

declare type EnhancedSessionType = Session & {
	user: Session['user'] & {
		id?: number
		plan?: UserPlanType
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

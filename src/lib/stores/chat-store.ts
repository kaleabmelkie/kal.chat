import type { SelectMessage } from '$lib/drizzle/schema/messages.server'
import type { SelectTopic } from '$lib/drizzle/schema/topics.server'
import type { Session } from '@auth/core/types'
import { writable } from 'svelte/store'

export type ChatStoreType = {
	activeTopic: Pick<SelectTopic, 'id' | 'responseMode'> & {
		messages: Pick<SelectMessage, 'id' | 'role' | 'content'>[]

		newMessage: {
			queue: string[]
			content: string
			isVoiceTyping: boolean
		}

		systemPromptTokensCount: number
		messagesCountInContext: number
		tokensCountInContext: number
	}

	browser: {
		isDesktop: boolean
		isAndroid: boolean
		isMicrosoftEdgeOnMacOS: boolean
	}

	newTopic: {
		isCreating: boolean
	}

	session: Session | null

	sideBar: {
		isOpen: boolean
		prefersOpen: boolean
	}

	topicsHistory: (Pick<SelectTopic, 'id' | 'updatedAt' | 'title'> & {
		messagesCount: number
	})[]

	window: {
		innerWidth: number
		innerHeight: number
	}
}

export const chatStore = writable<ChatStoreType | null>(null)

import type { Message, Topic } from '@prisma/client'
import { writable } from 'svelte/store'

export type ChatStoreType = {
	activeTopic: Pick<Topic, 'id'> & {
		messages: Pick<Message, 'id' | 'role' | 'content'>[]

		newMessage: {
			queue: string[]
			content: string
			isVoiceTyping: boolean
		}

		systemPromptTokensCount: number
		messagesCountInContext: number
		tokensCountInContext: number
	}

	newTopic: {
		isCreating: boolean
	}

	sideBar: {
		isOpen: boolean
		prefersOpen: boolean
	}

	topicsHistory: (Pick<Topic, 'id' | 'updatedAt' | 'title'> & {
		messagesCount: number
	})[]

	window: {
		innerWidth: number
		innerHeight: number

		userAgentFromHeader: string | null
	}
}

export const chatStore = writable<ChatStoreType | null>(null)
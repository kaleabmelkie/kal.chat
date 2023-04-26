import type { ChatStoreType } from '$lib/stores/chat-store'

export type NewMessageOkResponseBody = {
	newMessages: ChatStoreType['activeTopic']['messages']
	topicHistoryUpdatedAtIso: string
}

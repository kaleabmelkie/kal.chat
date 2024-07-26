import type { SelectTopic } from '$lib/drizzle/schema/topics.server'

export const models: {
	responseMode: SelectTopic['responseMode']
	name: string
	maxModelTokens: number
	maxResponseTokens: number
	maxRequestTokens: number
}[] = [
	{
		responseMode: 'faster',
		name: 'llama-3.1-8b-instant',
		maxModelTokens: 8_192,
		maxResponseTokens: 1_024,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
	{
		responseMode: 'better',
		name: 'llama-3.1-70b-versatile',
		maxModelTokens: 16_384,
		maxResponseTokens: 1_024,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
]

export const messagesCountInContext = 9 // TODO: remove this, and make it dynamic based on the model's max tokens

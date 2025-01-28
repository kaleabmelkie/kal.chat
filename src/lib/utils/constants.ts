import type { SelectTopic } from '$lib/drizzle/schema/topics.server'

export const models: {
	responseMode: SelectTopic['responseMode']
	name: string
	temperature?: number
	maxModelTokens: number
	maxResponseTokens: number
	maxRequestTokens: number
}[] = [
	{
		responseMode: 'faster',
		name: 'llama-3.3-70b-versatile',
		maxModelTokens: 131_072,
		maxResponseTokens: 16_384,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
	{
		responseMode: 'better',
		name: 'deepseek-r1-distill-llama-70b',
		maxModelTokens: 131_072,
		maxResponseTokens: 16_384,
		temperature: 0.6,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
]

export const messagesCountInContext = 9 // TODO: remove this, and make it dynamic based on the model's max tokens

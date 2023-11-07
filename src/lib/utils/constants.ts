import type { ResponseModeType } from '@prisma/client'

export const models: {
	responseMode: ResponseModeType
	name: string
	maxModelTokens: number
	maxResponseTokens: number
	maxRequestTokens: number
}[] = [
	{
		responseMode: 'faster',
		name: 'gpt-3.5-turbo-1106',
		maxModelTokens: 16_384,
		maxResponseTokens: 500,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
	{
		responseMode: 'better',
		name: 'gpt-4-1106-preview',
		maxModelTokens: 131_072,
		maxResponseTokens: 1_000,
		get maxRequestTokens() {
			return this.maxModelTokens - this.maxResponseTokens
		},
	},
]

export const messagesCountInContext = 9 // TODO: remove this, and make it dynamic based on the model's max tokens

export const freeUserModelName = 'gpt-3.5-turbo' as const
export const nonFreeUserModelName = 'gpt-4' as const

export const freeUserMaxModelTokens = 4_096
export const nonFreeUserMaxModelTokens = 8_192

export const freeUserMaxResponseTokens = 500
export const nonFreeUserMaxResponseTokens = 1_000

export const freeUserMaxRequestTokens = freeUserMaxModelTokens - freeUserMaxResponseTokens
export const nonFreeUserMaxRequestTokens = nonFreeUserMaxModelTokens - nonFreeUserMaxResponseTokens

export const messagesCountInContext = 9 // TODO: remove this, and make it dynamic based on the model's max tokens

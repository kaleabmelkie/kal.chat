import { GROQ_API_KEY, OPENAI_API_KEY } from '$env/static/private'
import { Groq } from 'groq-sdk'

const apisByKey = new Map<string, Groq>()

export function getGroq(apiKey: string | null) {
	if (!apiKey) {
		apiKey = OPENAI_API_KEY
	}

	let groq = apisByKey.get(apiKey)

	if (!groq) {
		groq = new Groq({
			apiKey: GROQ_API_KEY,
		})

		apisByKey.set(apiKey, groq)
	}

	return groq
}

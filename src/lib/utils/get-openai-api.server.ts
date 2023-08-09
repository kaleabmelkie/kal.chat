import { OPENAI_API_KEY } from '$env/static/private'
import { Configuration, OpenAIApi } from 'openai-edge'

const apisByKey = new Map<string, OpenAIApi>()

export function getOpenAiApi(apiKey: string | null) {
	if (!apiKey) {
		apiKey = OPENAI_API_KEY
	}

	let openAiApi = apisByKey.get(apiKey)

	if (!openAiApi) {
		openAiApi = new OpenAIApi(
			new Configuration({
				apiKey,
			}),
		)

		apisByKey.set(apiKey, openAiApi)
	}

	return openAiApi
}

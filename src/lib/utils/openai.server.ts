import { OPENAI_API_KEY } from '$env/static/private'
import { Configuration, OpenAIApi } from 'openai'

export const openai = new OpenAIApi(
	new Configuration({
		apiKey: OPENAI_API_KEY,
	}),
)

import type { ChatCompletionRequestMessage } from 'openai';
import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		messages: [
			{ role: 'assistant', content: `Selam! I'm Kal. How can I help you?` }
		] satisfies ChatCompletionRequestMessage[]
	};
}) satisfies PageLoad;

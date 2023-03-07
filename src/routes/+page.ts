import type { ChatCompletionRequestMessage } from 'openai';
import type { PageLoad } from './$types';

export const load = (async () => {
	return {
		messages: [
			{ role: 'assistant', content: 'Hello, how are you?' },
			{ role: 'user', content: 'I am fine, thank you.' },
			{ role: 'assistant', content: 'That is good to hear. How can I help you?' },
			{ role: 'user', content: 'I would like to buy a new phone.' },
			{ role: 'assistant', content: 'What kind of phone are you looking for?' },
			{ role: 'user', content: 'I would like to buy a new iPhone.' },
			{ role: 'assistant', content: 'What model of iPhone are you looking for?' },
			{ role: 'user', content: 'I would like to buy a new iPhone 12.' },
			{ role: 'assistant', content: 'What color of iPhone 12 are you looking for?' },
			{ role: 'user', content: 'I would like to buy a new iPhone 12 in blue.' },
			{ role: 'assistant', content: 'What size of iPhone 12 in blue are you looking for?' },
			{ role: 'user', content: 'I would like to buy a new iPhone 12 in blue, 128GB.' }
		] satisfies ChatCompletionRequestMessage[]
	};
}) satisfies PageLoad;

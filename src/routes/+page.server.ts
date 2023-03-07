import { openai } from '$lib/utils/openai.server';
import { countTokens } from '$lib/utils/tokenizer.server';
import { error, type Actions } from '@sveltejs/kit';
import type { ChatCompletionRequestMessage } from 'openai';

export const actions: Actions = {
	chat: async ({ request }) => {
		const formData = await request.formData();

		const oldMessages = JSON.parse(
			formData.get('oldMessages')?.toString() ?? '[]'
		) as ChatCompletionRequestMessage[];
		if (
			!Array.isArray(oldMessages) ||
			oldMessages.some(
				({ role, content }) => typeof role !== 'string' || typeof content !== 'string'
			)
		) {
			throw error(400, 'Invalid old messages');
		}

		const message = formData.get('message')?.toString();
		if (!message || typeof message !== 'string') {
			throw error(400, 'Invalid message');
		}

		const reqMessages: ChatCompletionRequestMessage[] = [
			...oldMessages.slice(-10),
			{ role: 'user', content: message }
		];

		let tokenCount = 0;
		for (const message of reqMessages) {
			tokenCount += countTokens(message.content);
		}
		if (tokenCount > 4096) {
			throw error(400, 'Too many tokens');
		}

		const moderationResponse = await openai.createModeration({
			input: reqMessages[reqMessages.length - 1].content
		});
		if (moderationResponse.data.results.find((result) => result.flagged)) {
			throw error(400, 'Message flagged by OpenAI');
		}

		const systemPrompt =
			'You are a virtual assistant called Kal. Your job is to assist anyone who needs help with anything.';

		tokenCount += countTokens(systemPrompt);
		if (tokenCount > 4096) {
			throw error(400, 'Too many tokens');
		}

		const chatResponse = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: [{ role: 'system', content: systemPrompt }, ...reqMessages]
		});

		return {
			messages: [
				...reqMessages,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				...chatResponse.data.choices.map((choice) => choice.message!).filter((message) => !!message)
			]
		};
	}
};

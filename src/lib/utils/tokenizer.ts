import GPT3TokenizerImport from 'gpt3-tokenizer'

const GPT3Tokenizer =
	typeof GPT3TokenizerImport === 'function'
		? GPT3TokenizerImport
		: (GPT3TokenizerImport as { default: typeof GPT3TokenizerImport }).default

export const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })

export function countTokens(text: string) {
	return tokenizer.encode(text).text.length
}

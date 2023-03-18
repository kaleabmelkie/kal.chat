export async function countTokens(text: string): Promise<number> {
	const { tokenizer } = await import('./gpt3-tokenizer-import')

	return tokenizer.encode(text).text.length
}

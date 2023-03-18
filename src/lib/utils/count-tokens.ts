import type GPT3TokenizerImportType from 'gpt3-tokenizer/dist/tokenizer'

let tokenizer: InstanceType<{ new (): GPT3TokenizerImportType }> | undefined = undefined

export async function initTokenizer() {
	if (tokenizer) {
		return
	}

	const { default: GPT3TokenizerImport } = await import('gpt3-tokenizer')
	tokenizer = new GPT3TokenizerImport({
		type: 'gpt3',
	})
}

export async function countTokens(text: string): Promise<number> {
	if (!tokenizer) {
		await initTokenizer()
		return countTokens(text)
	}

	return tokenizer.encode(text).text.length
}

initTokenizer().catch(console.error)

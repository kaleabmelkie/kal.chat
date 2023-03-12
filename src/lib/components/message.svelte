<script lang="ts">
	import type { marked } from 'marked'
	import type { ChatCompletionRequestMessage } from 'openai'
	import SvelteMarkdown from 'svelte-markdown'
	import { slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: ChatCompletionRequestMessage

	$: markedOptions = {
		// highlight: (code, lang) => prism.highlight(code, prism.languages[lang], lang), // TODO: fix this
		breaks: true,
		gfm: true,
		mangle: false,
		sanitize: true,
		smartypants: true,
	} satisfies marked.MarkedOptions
</script>

<li
	class="grid max-w-screen-sm gap-2 {message.role === 'user'
		? 'ml-auto pl-8'
		: 'mr-auto pr-8'} {className}"
	transition:slide|local={{ duration: 150 }}
>
	<div
		class="text-xs font-semibold uppercase text-sky-600 {message.role === 'user'
			? 'pr-6 text-right'
			: 'pl-6 text-left'}"
	>
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<article
		class="prose relative rounded-[1.75rem] py-3 px-6 text-lg shadow-md shadow-sky-600/20 {message.role ===
		'user'
			? 'bg-sky-900 text-right text-white'
			: 'bg-white text-left text-black'}  {articleClassName}"
	>
		<SvelteMarkdown source={message.content} options={markedOptions} />
	</article>
</li>

<style lang="postcss">
	article {
		@apply w-full max-w-full overflow-x-auto;
	}

	article :global(pre) {
		@apply text-sm leading-6;
	}
</style>

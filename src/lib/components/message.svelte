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
		gfm: true,
		mangle: false,
		sanitize: true,
		smartypants: true,
	} satisfies marked.MarkedOptions
</script>

<li
	class="grid max-w-screen-sm gap-1 {message.role === 'user'
		? 'ml-auto pl-8'
		: 'mr-auto pr-8'} {className}"
	transition:slide|local={{ duration: 150 }}
>
	<div class="text-xs opacity-75 {message.role === 'user' ? 'text-right' : 'text-left'}">
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<article
		class="shadow-blue-30 prose relative rounded-xl py-2 px-3 text-lg shadow {message.role ===
		'user'
			? 'bg-blue-900 text-white'
			: 'bg-white text-black'} {articleClassName}"
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

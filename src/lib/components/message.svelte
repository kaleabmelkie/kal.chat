<script lang="ts">
	import { marked } from 'marked'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { highlight, languages } from 'prismjs'
	import 'prismjs/themes/prism-okaidia.min.css'
	import sanitizeHtml from 'sanitize-html'
	import { slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: ChatCompletionRequestMessage

	$: parsedContent = marked(message.content, {
		highlight: (code, lang, callback) =>
			callback?.(null, languages[lang] ? highlight(code, languages[lang], lang) : code),
		breaks: true,
		gfm: true,
		mangle: false,
		smartLists: true,
		smartypants: true,
	})
</script>

<li
	class="grid max-w-screen-sm gap-2 {message.role === 'user'
		? 'ml-auto pl-8'
		: 'mr-auto pr-8'} {className}"
	transition:slide|local={{ duration: 150 }}
>
	<div
		class="text-xs font-semibold uppercase text-sky-600 {message.role === 'user'
			? 'text-right'
			: 'text-left'}"
	>
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<article
		class="prose relative rounded-[1.75rem] bg-gradient-to-tr py-3 px-6 text-lg shadow-md shadow-sky-600/10 {message.role ===
		'user'
			? 'prose-invert rounded-tr bg-sky-600/90 from-sky-600/25 to-sky-600/0 text-white'
			: 'rounded-tl bg-white/75 from-white/25 to-white/0 text-black'} {articleClassName}"
	>
		{@html sanitizeHtml(parsedContent, {
			allowedClasses: {
				pre: [/^language-/],
				code: [/^language-/],
			},
		})})}
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

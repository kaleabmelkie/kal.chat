<script lang="ts">
	// prism import must come first
	import Prism from 'prismjs'
	import 'prismjs/themes/prism-okaidia.min.css'
	// then, prism plugins can follow
	import 'prismjs/plugins/autoloader/prism-autoloader.js'

	// normal imports
	import { marked } from 'marked'
	import type { ChatCompletionRequestMessage } from 'openai'
	import loadLanguages from 'prismjs/components/'
	import sanitizeHtml from 'sanitize-html'
	import { slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: ChatCompletionRequestMessage

	$: if (Prism.plugins.autoloader) {
		Prism.plugins.autoloader.languages_path = '../../../node_modules/prismjs/components/'
	}

	$: parsedContent = marked(message.content, {
		highlight: (code, lang, callback) => {
			loadLanguages([lang])
			callback?.(
				null,
				Prism.languages[lang] ? Prism.highlight(code, Prism.languages[lang], lang) : code,
			)
		},
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
		})}
	</article>
</li>

<style lang="postcss">
	article {
		@apply w-full max-w-full overflow-x-auto;
	}

	article :global(pre) {
		@apply bg-black bg-gradient-to-tr from-sky-600/30 to-sky-400/30 text-sm leading-6;
	}
</style>

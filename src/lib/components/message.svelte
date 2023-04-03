<script lang="ts">
	import 'highlight.js/styles/github-dark.css'
	import type { ChatCompletionRequestMessage } from 'openai'
	import { slide } from 'svelte/transition'

	let className = ''
	export { className as class }
	export let articleClassName = ''
	export let message: ChatCompletionRequestMessage
</script>

<li
	class="grid max-w-screen-md gap-2 {message.role === 'user'
		? 'ml-auto pl-8'
		: 'mr-auto pr-8'} {className}"
	transition:slide|local={{ duration: 150 }}
>
	<div
		class="text-xs font-semibold uppercase text-primary-600 {message.role === 'user'
			? 'text-right'
			: 'text-left'}"
	>
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<article
		class="match-braces prose relative rounded-[1.75rem] bg-gradient-to-tr px-4 py-3 text-lg shadow-md shadow-primary-600/10 {message.role ===
		'user'
			? 'prose-invert rounded-tr from-primary-700/90 to-primary-500/75 text-white'
			: 'rounded-tl from-white/95 to-white/75 text-black'} {articleClassName}"
	>
		{@html message.content}
	</article>
</li>

<style lang="postcss">
	article {
		@apply w-full max-w-full overflow-x-auto;
	}

	article :global(pre) {
		@apply !rounded-[calc(1.75rem-1rem/2)] my-1 bg-black bg-gradient-to-tr from-primary-600/30 to-primary-400/30 p-[1rem] text-sm leading-6;
	}
</style>

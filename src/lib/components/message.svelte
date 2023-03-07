<script lang="ts">
	import type { ChatCompletionRequestMessage } from 'openai';
	import SvelteMarkdown from 'svelte-markdown';
	import { slide } from 'svelte/transition';

	let className = '';
	export { className as class };
	export let articleClassName = '';
	export let message: ChatCompletionRequestMessage;
</script>

<li
	class="grid max-w-screen-sm gap-1 {message.role === 'user'
		? 'ml-auto pl-8'
		: 'mr-auto pr-8'} {className}"
	transition:slide|local
>
	<div class="text-xs opacity-75 {message.role === 'user' ? 'text-right' : 'text-left'}">
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<article
		class="prose relative rounded-xl py-2 px-3 text-lg shadow {message.role === 'user'
			? 'bg-black text-white'
			: 'bg-white text-black'} {articleClassName}"
	>
		<SvelteMarkdown source={message.content} />
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

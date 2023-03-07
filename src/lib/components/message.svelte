<script lang="ts">
	import type { ChatCompletionRequestMessage } from 'openai';
	import { slide } from 'svelte/transition';

	export let message: ChatCompletionRequestMessage;
</script>

<li
	class="grid max-w-md gap-1 {message.role === 'user' ? 'ml-auto pl-8' : 'mr-auto pr-8'}"
	transition:slide|local
>
	<div class="text-xs opacity-75 {message.role === 'user' ? 'text-right' : 'text-left'}">
		{message.role === 'user' ? 'You' : 'Kal'}
	</div>

	<div
		class="rounded-xl py-2 px-3 text-lg shadow {message.role === 'user'
			? 'bg-black text-white'
			: 'bg-white text-black'}"
	>
		{message.content}
	</div>
</li>

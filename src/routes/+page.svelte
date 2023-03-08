<script lang="ts">
	import { enhance } from '$app/forms';
	import Message from '$lib/components/message.svelte';
	import { onMount, tick } from 'svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	onMount(() => {
		scrollToBottom();
	});

	let loading = false;
	let messagesListEle: HTMLUListElement | null = null;
	let typingDotCount = 0;

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4;
	}, 300);

	$: messages = form?.messages ?? data.messages;

	async function scrollToBottom() {
		await tick();
		setTimeout(async () => {
			await tick();
			if (messagesListEle) {
				messagesListEle.scrollTo({
					top: messagesListEle.scrollHeight,
					behavior: 'smooth'
				});
			}
		}, 500);
	}
</script>

<main class="relative h-screen bg-slate-200">
	<ul
		class="mx-auto flex h-full w-full max-w-screen-md flex-col gap-4 overflow-auto p-4 pb-[calc(1rem+8rem)]"
		bind:this={messagesListEle}
	>
		<span class="flex-1" />
		{#each messages as message}
			<Message {message} />
		{/each}
		{#if loading}
			<Message
				message={{
					role: 'system',
					content: `_Typing${[...Array(typingDotCount)].map(() => '.').join('')}_`
				}}
				class="animate-pulse"
			/>
		{/if}
	</ul>

	<form
		class="relative mx-auto mt-[-8rem] flex h-[8rem] w-full max-w-screen-md gap-1 bg-gradient-to-t from-slate-200 to-transparent p-4"
		method="POST"
		action="?/chat"
		use:enhance={async ({ form }) => {
			loading = true;
			messages = [...messages, { role: 'user', content: form.message.value }];
			form.reset();
			await scrollToBottom();
			return async ({ update }) => {
				loading = false;
				await update();
				scrollToBottom();
			};
		}}
	>
		<input type="hidden" name="oldMessages" value={JSON.stringify(messages)} />

		<textarea
			class="h-full max-h-full min-h-full flex-1 resize-none rounded-xl border border-slate-300 bg-white/90 p-4 pr-[calc(1rem+4rem)] shadow backdrop-blur backdrop-saturate-200 transition-all hover:bg-white"
			name="message"
			placeholder="Type your message..."
			autocomplete="off"
			
			required
		/>

		<button
			class="absolute top-4 right-4 bottom-4 w-16 rounded-r-xl transition-all active:scale-95 active:bg-slate-100"
			type="submit"
		>
			Send
		</button>
	</form>
</main>

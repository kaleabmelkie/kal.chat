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
	let termTextareaEle: HTMLTextAreaElement | null = null;

	$: messages = form?.messages ?? data.messages;

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4;
	}, 300);

	async function scrollToBottom() {
		await tick();
		if (messagesListEle) {
			messagesListEle.scrollTo({
				top: messagesListEle.scrollHeight,
				behavior: 'smooth'
			});
		}
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
		class="relative mx-auto mt-[-8rem] h-[8rem] w-full max-w-screen-md gap-1"
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
		<input class="hidden" type="hidden" name="oldMessages" value={JSON.stringify(messages)} />

		<div class="absolute left-4 right-4 bottom-[3.5rem] flex">
			<!-- svelte-ignore a11y-autofocus -->
			<textarea
				class="flex-1 resize-none rounded-xl border border-slate-300 bg-white/90 p-4 pr-[calc(1rem+4rem)] text-base leading-[1.5rem] shadow-lg outline-none backdrop-blur backdrop-saturate-200 transition-all duration-300 hover:border-slate-400 hover:bg-white/95 hover:shadow-2xl focus:border-slate-400 focus:bg-white/95 focus:shadow-2xl {termTextareaEle &&
				termTextareaEle.scrollHeight < 140
					? 'overflow-hidden'
					: 'overflow-auto'}"
				style="height: {termTextareaEle
					? `${termTextareaEle.scrollHeight}px`
					: `calc(1rem + 1.5rem + 1rem)`}"
				name="message"
				placeholder="Ask me anything..."
				autocomplete="off"
				autofocus
				required
				bind:this={termTextareaEle}
				on:input={(e) => {
					const heightBackup = e.currentTarget.style.height;
					e.currentTarget.style.transitionProperty = 'none';
					e.currentTarget.style.height = `1px`;
					const newHeight = `${e.currentTarget.scrollHeight}px`;
					e.currentTarget.style.height = heightBackup;
					e.currentTarget.scrollHeight; // keep this line to `tick()` the DOM state and avoid height flakiness
					e.currentTarget.style.transitionProperty = 'all';
					e.currentTarget.style.height = newHeight;
				}}
				on:keydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
						e.preventDefault();
						e.currentTarget.form?.submitButton?.click();
					}
				}}
			/>

			<button
				class="absolute top-0 right-0 bottom-0 w-16 rounded-r-xl transition-all active:scale-95 active:bg-slate-100"
				type="submit"
				name="submitButton"
			>
				Send
			</button>
		</div>
	</form>
</main>

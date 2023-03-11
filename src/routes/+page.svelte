<script lang="ts">
	import { enhance } from '$app/forms'
	import Message from '$lib/components/message.svelte'
	import { onMount } from 'svelte'
	import type { ActionData, PageData } from './$types'

	export let data: PageData
	export let form: ActionData

	onMount(() => {
		scrollToBottom()
	})

	let loading = false
	let messagesListEle: HTMLUListElement | null = null
	let typingDotCount = 0
	let messageBoxEle: HTMLTextAreaElement | null = null

	$: messages = form?.messages ?? data.messages

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4
	}, 300)

	async function scrollToBottom() {
		if (messagesListEle) {
			messagesListEle.scrollTop = messagesListEle.scrollHeight
		}
	}
</script>

<main class="bg-blue-100">
	<ul
		class="mx-auto flex min-h-screen max-w-screen-md flex-col gap-4 p-4 pb-[calc(1rem+8rem)]"
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
					content: `_Thinking${[...Array(typingDotCount)].map(() => '.').join('')}_`,
				}}
				class="animate-pulse"
				articleClassName="text-blue-900"
			/>
		{/if}
	</ul>

	<form
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 mx-auto h-[8rem] w-full max-w-screen-md gap-1"
		method="POST"
		action="?/chat"
		use:enhance={async ({ form }) => {
			if (loading) {
				return
			}
			loading = true
			messages = [...messages, { role: 'user', content: form.message.value }]
			form.reset()
			await scrollToBottom()
			return async ({ update }) => {
				loading = false
				await update()
				scrollToBottom()
			}
		}}
	>
		<input
			class="hidden"
			type="hidden"
			name="oldMessages"
			value={JSON.stringify(messages.slice(-10))}
			disabled={loading}
			readonly
		/>

		<div class="group pointer-events-auto absolute left-4 right-4 bottom-[3.5rem] flex">
			<!-- svelte-ignore a11y-autofocus -->
			<textarea
				data-testid="message-box"
				class="flex-1 transform-gpu resize-none rounded-xl border border-blue-200 bg-white/90 p-4 pr-[calc(1rem+4rem)] text-base leading-[1.5rem] shadow-lg shadow-blue-900/25 outline-none backdrop-blur backdrop-saturate-200 transition-all duration-300 hover:border-blue-400 hover:bg-white/95 hover:shadow-2xl hover:shadow-blue-900/50 focus:scale-[101%] focus:border-blue-400 focus:bg-white/95 focus:shadow-2xl focus:shadow-blue-900/50 disabled:bg-white/75 disabled:shadow-sm {messageBoxEle &&
				messageBoxEle.scrollHeight < 140
					? 'overflow-hidden'
					: 'overflow-auto'}"
				style="height: {messageBoxEle
					? `${messageBoxEle.scrollHeight}px`
					: `calc(1rem + 1.5rem + 1rem)`}"
				name="message"
				placeholder="Ask me anything..."
				disabled={loading}
				autocapitalize="off"
				autocomplete="off"
				spellcheck="false"
				autocorrect="off"
				autofocus
				required
				bind:this={messageBoxEle}
				on:input={(e) => {
					const heightBackup = e.currentTarget.style.height
					e.currentTarget.style.transitionProperty = 'none'
					e.currentTarget.style.height = `1px`
					const newHeight = `${e.currentTarget.scrollHeight}px`
					e.currentTarget.style.height = heightBackup
					e.currentTarget.scrollHeight // keep this line to `tick()` the DOM state and avoid height flakiness
					e.currentTarget.style.transitionProperty = 'all'
					e.currentTarget.style.height = newHeight
				}}
				on:keydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
						e.preventDefault()
						e.currentTarget.form?.submitButton?.click()
					}
				}}
			/>

			<button
				data-testid="send-button"
				class="absolute top-0 right-0 bottom-0 w-16 rounded-r-xl transition-all active:scale-95 active:bg-slate-100"
				type="submit"
				name="submitButton"
				disabled={loading}
			>
				Send
			</button>
		</div>
	</form>

	<div
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-0 h-[8rem] bg-gradient-to-t from-blue-100/100 to-blue-100/0"
	/>
</main>

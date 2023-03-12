<script lang="ts">
	import { enhance } from '$app/forms'
	import Message from '$lib/components/message.svelte'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import RefreshSvg from '$lib/icons/refresh.svg.svelte'
	import { onMount, tick } from 'svelte'

	export let data
	export let form

	onMount(() => {
		scrollToBottom()
	})

	let innerWidth = 0
	let innerHeight = 0
	let loading = false
	let messagesListEle: HTMLUListElement | null = null
	let typingDotCount = 0
	let messageBoxEle: HTMLTextAreaElement | null = null
	let message = ''

	$: messages = form?.messages ?? data.messages

	const maxMessageBoxHeight = 420
	$: {
		;[innerWidth, innerHeight, message, loading] // deps
		if (messageBoxEle) {
			messageBoxEle.style.height = `${Math.min(messageBoxEle.scrollHeight, maxMessageBoxHeight)}px`
			messageBoxEle.style.maxHeight = `${maxMessageBoxHeight}px`
			messageBoxEle.style.overflowY =
				messageBoxEle.scrollHeight < maxMessageBoxHeight ? 'hidden' : 'auto'

			const heightBackup = messageBoxEle.style.height
			messageBoxEle.style.transitionProperty = 'none'
			messageBoxEle.style.height = `3.5rem`

			const newHeight = `${messageBoxEle.scrollHeight}px`
			messageBoxEle.style.height = heightBackup
			;[messageBoxEle.scrollHeight] // deps

			messageBoxEle.style.transitionProperty = 'all'
			messageBoxEle.style.height = newHeight
		}
	}

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4
	}, 300)

	async function scrollToBottom() {
		if (messagesListEle) {
			messagesListEle.scrollTop = messagesListEle.scrollHeight
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<main class="bg-gradient-to-t from-white to-sky-200 bg-fixed">
	<ul
		class="mx-auto flex min-h-screen max-w-[48rem] flex-col gap-6 p-4 pb-[calc(1rem+8rem)]"
		bind:this={messagesListEle}
	>
		<span class="flex-1" />
		{#each messages as message, index (index)}
			<!-- TODO: change the key to message.id -->
			<Message {message} />
		{/each}
		{#if loading}
			{#key 'Thinking...'}
				<Message
					message={{
						role: 'system',
						content: `Thinking${[...Array(typingDotCount)].map(() => '.').join('')}`,
					}}
					class="animate-pulse"
					articleClassName="text-sky-900 !shadow-none !bg-transparent"
				/>
			{/key}
		{/if}
		<span class="h-2" />
	</ul>

	<form
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 mx-auto h-[8rem] w-full max-w-[calc(4rem+48rem+4rem)] gap-1"
		method="POST"
		action="?/chat"
		use:enhance={async ({ form }) => {
			if (loading) {
				return
			}
			loading = true

			messages = [...messages, { role: 'user', content: form.message.value }]
			message = ''

			await scrollToBottom()

			return async ({ update }) => {
				await update()

				await scrollToBottom()

				loading = false
				await tick()
				messageBoxEle?.focus()
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

		<div class="absolute left-4 right-4 bottom-[3.5rem] flex items-end gap-[calc(0.5rem+3px)]">
			<button
				class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-sky-900 shadow-lg shadow-sky-900/20 ring-2 ring-sky-600/75 backdrop-blur backdrop-saturate-200 transition-all duration-150 hover:bg-white/95 hover:shadow-sky-900/30 focus:bg-white/95 active:shadow-xl active:shadow-sky-900/20 active:ring-offset-2 active:ring-offset-sky-50 disabled:animate-pulse disabled:bg-sky-600/25 disabled:text-sky-900/0 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 disabled:backdrop-blur-sm disabled:backdrop-saturate-100"
				type="reset"
				title="New topic"
				on:click={() => alert('TODO: implement clear()')}
			>
				<RefreshSvg />
			</button>

			<div class="group pointer-events-auto relative flex flex-1">
				<!-- svelte-ignore a11y-autofocus -->
				<textarea
					data-testid="message-box"
					class="placeholder:text-sky-700/ h-[3.5rem] w-full min-w-0 flex-1 resize-none rounded-[1.75rem] bg-white/75 py-4 px-6 pr-[calc(1.5rem+3.5rem)] text-lg font-medium leading-[1.5rem] text-black shadow-lg shadow-sky-900/20 outline-none ring-2 ring-sky-600/75 backdrop-blur backdrop-saturate-200 transition-all duration-150 hover:bg-white/95 hover:shadow-sky-900/30 focus:bg-white/95 focus:shadow-xl focus:shadow-sky-900/20 focus:ring-offset-2 focus:ring-offset-sky-50 disabled:animate-pulse disabled:bg-sky-600/25 disabled:text-sky-900/0 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 disabled:backdrop-blur-sm disabled:backdrop-saturate-100"
					name="message"
					placeholder={loading ? '' : `Ask me anything...`}
					disabled={loading}
					autocapitalize="off"
					autocomplete="off"
					spellcheck="false"
					autocorrect="off"
					autofocus
					required
					bind:this={messageBoxEle}
					bind:value={message}
					on:input={(e) => {
						const heightBackup = e.currentTarget.style.height
						e.currentTarget.style.transitionProperty = 'none'
						e.currentTarget.style.height = `3.5rem`
						const newHeight = `${e.currentTarget.scrollHeight}px`
						e.currentTarget.style.height = heightBackup
						;[e.currentTarget.scrollHeight] // deps
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
					class="absolute top-0 right-0 bottom-0 flex w-[3.5rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-sky-900 transition-all duration-150 hover:bg-sky-300/25 active:bg-sky-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-sky-900/0"
					type="submit"
					name="submitButton"
					disabled={loading}
				>
					<ArrowRightSvg />
				</button>
			</div>

			<button
				class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-sky-900 shadow-lg shadow-sky-900/20 ring-2 ring-sky-600/75 backdrop-blur backdrop-saturate-200 transition-all duration-150 hover:bg-white/95 hover:shadow-sky-900/30 focus:bg-white/95 active:shadow-xl active:shadow-sky-900/20 active:ring-offset-2 active:ring-offset-sky-50 disabled:animate-pulse disabled:bg-sky-600/25 disabled:text-sky-900/0 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 disabled:backdrop-blur-sm disabled:backdrop-saturate-100"
				type="button"
				title="Type using voice"
				disabled={loading}
				on:click={() => alert('TODO: implement voiceInput()')}
			>
				<MicSvg />
			</button>
		</div>
	</form>

	<div
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-0 h-[8rem] bg-gradient-to-t from-sky-50 to-sky-50/0"
	/>
</main>

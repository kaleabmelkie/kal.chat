<script lang="ts">
	import { browser } from '$app/environment'
	import { enhance } from '$app/forms'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import Message from '$lib/components/message.svelte'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import PlusSvg from '$lib/icons/plus.svg.svelte'
	import { countTokens } from '$lib/utils/tokenizer'
	import Bowser from 'bowser'
	import orderBy from 'lodash/orderBy'
	import { onMount, tick } from 'svelte'

	export let data

	onMount(() => {
		scrollToBottom()
		setUpVoiceTyping()
	})

	const maxTokens = 4000

	let innerWidth = 0
	let innerHeight = 0
	let loading = false
	let messagesListEle: HTMLUListElement | null = null
	let typingDotCount = 0
	let bottomEle: HTMLSpanElement | null = null
	let messageBoxEle: HTMLTextAreaElement | null = null
	let message = ''
	let isVoiceTyping = false
	let originalMessage = message
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any
	let submitButtonEle: HTMLButtonElement | null = null

	$: maxMessageBoxHeight = innerHeight ? innerHeight / 2 : 420
	$: tokensActive = countTokens([...data.thread.Message.map((m) => m.content), message].join(''))

	$: {
		;[innerWidth, innerHeight, message, loading, isVoiceTyping] // deps
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
	}, 150)

	async function scrollToBottom() {
		if (!bottomEle) {
			return
		}
		bottomEle.scrollIntoView({ behavior: 'smooth' })
		await tick()
		setTimeout(() => {
			if (!bottomEle) {
				return
			}
			bottomEle.scrollIntoView({ behavior: 'smooth' })
		}, 150)
	}

	$: userAgentParser = Bowser.getParser(
		browser ? window.navigator.userAgent : data.userAgent ?? ' ',
	)
	$: isBlacklistedBrowserForVoiceInput =
		userAgentParser.getOS().name === 'Android' ||
		(userAgentParser.getPlatformType() === 'desktop' &&
			userAgentParser.getBrowserName() === 'Microsoft Edge')
	$: isVoiceTypingSupported =
		browser && 'webkitSpeechRecognition' in window && !isBlacklistedBrowserForVoiceInput

	async function setUpVoiceTyping() {
		if (isVoiceTyping || !isVoiceTypingSupported || !('webkitSpeechRecognition' in window)) {
			return
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		recognition = new (window.webkitSpeechRecognition as any)()
		recognition.lang = 'en'
		recognition.continuous = true
		recognition.interimResults = true
		recognition.onstart = () => {
			originalMessage = message
			isVoiceTyping = true
		}
		// eslint-disable-next-line no-undef
		recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
			message = `${originalMessage.replace(/ $/, '')} ${Array.from(event.results)
				.map((alternatives) =>
					orderBy(alternatives, (a) => a.confidence, 'desc')[0].transcript.trim(),
				)
				.join(' ')
				.trim()}`
		}
		recognition.onerror = async (event: { error: string }) => {
			if (!['aborted', 'no-speech'].includes(event.error)) {
				console.error('Speech recognition error:', event)
				alert(`Speech recognition error: ${event?.error ?? 'Unknown error'}`)
			}
			originalMessage = message
			isVoiceTyping = false
			await tick()
			messageBoxEle?.focus()
		}
		recognition.onend = async () => {
			originalMessage = message
			isVoiceTyping = false
			await tick()
			messageBoxEle?.focus()
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<ul
	class="mx-auto flex min-h-screen max-w-[48rem] transform-gpu flex-col gap-6 scroll-smooth p-4 pb-[calc(2rem+1rem+8rem)]"
	bind:this={messagesListEle}
>
	<div class="min-h-[3.5rem] flex-1" />
	{#each data.thread.Message.filter((m) => m.role !== 'system') as message (message.id)}
		<Message {message} />
	{/each}
	{#if loading}
		{#key 'Typing...'}
			<Message
				message={{
					role: 'system',
					content: `Typing${[...Array(typingDotCount)].map(() => '.').join('')}`,
				}}
				articleClassName="!animate-pulse !bg-transparent !bg-none !px-0 !text-emerald-900 !shadow-none"
			/>
		{/key}
	{/if}
</ul>

<form
	class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 mx-auto grid h-[8rem] w-full max-w-[calc(4rem+48rem+4rem)] gap-1 p-4"
	method="POST"
	action="?/newMessage"
	use:enhance={async ({ form }) => {
		if (loading) {
			return
		}
		loading = true

		const valueBackup = form.message.value

		data.thread.Message = [
			...data.thread.Message,
			{
				id: data.thread.Message[data.thread.Message.length - 1]
					? data.thread.Message[data.thread.Message.length - 1].id + 1
					: 0, // to be replaced
				createdAt: new Date(), // to be replaced
				updatedAt: new Date(), // to be replaced
				role: 'user',
				content: form.message.value,
				threadId: Number($page.params.id), // to be replaced
			},
		]
		message = ''

		await scrollToBottom()

		return async ({ result, update }) => {
			switch (result.type) {
				case 'error':
					alert(`Error: ${result.error?.message ?? 'Unknown cause'}`)
					data.thread.Message = data.thread.Message.slice(0, -1)
					message = valueBackup + message
					break
				case 'failure':
					alert(`Failure: ${result.data?.message ?? 'Unknown cause'}`)
					data.thread.Message = data.thread.Message.slice(0, -1)
					message = valueBackup + message
					break
				case 'success':
					data.thread = result.data?.thread ?? data.thread
					break
				case 'redirect':
					console.info(`Redirecting to: ${result.location}`)
					await update()
					break
				default:
					alert(`Failed to send your message.\nPlease, try again.`)
					data.thread.Message = data.thread.Message.slice(0, -1)
					message = valueBackup + message
					break
			}

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
		name="threadId"
		value={data.thread.id}
		disabled={loading}
		readonly
	/>

	<div class="flex h-[3.5rem] items-end gap-[calc(0.5rem+3px)]">
		<a
			data-sveltekit-preload-data="tap"
			class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/90 text-emerald-900 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-600/75 transition-all duration-150 hover:bg-white hover:shadow-emerald-900/30 focus:bg-white active:shadow-xl active:shadow-emerald-900/20 active:ring-offset-2 active:ring-offset-emerald-50 disabled:animate-pulse disabled:bg-emerald-600/25 disabled:text-emerald-900/50 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0"
			title="New thread"
			href="/thread/new"
		>
			<PlusSvg />
		</a>

		<div class="group pointer-events-auto relative flex flex-1">
			<!-- svelte-ignore a11y-autofocus -->
			<textarea
				data-testid="message-box"
				class="h-[3.5rem] w-full min-w-0 flex-1 resize-none rounded-[1.75rem] bg-white/90 py-4 px-6 text-lg leading-[1.5rem] text-black shadow-lg shadow-emerald-900/20 outline-none ring-2 ring-emerald-600/75 transition-all duration-150 placeholder:text-emerald-700/50 read-only:ring-0 read-only:ring-offset-0 hover:bg-white hover:shadow-emerald-900/30 focus:bg-white focus:shadow-xl focus:shadow-emerald-900/20 focus:ring-offset-2 focus:ring-offset-emerald-50 disabled:animate-pulse disabled:bg-emerald-600/25 disabled:text-emerald-900/50 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 {isVoiceTypingSupported
					? 'pr-[calc(1.5rem+3.5rem+4rem)]'
					: 'pr-[calc(1.5rem+4rem)]'} {isVoiceTyping ? 'animate-pulse' : ''} {tokensActive >
				maxTokens
					? '!ring-red-600/75 !ring-offset-red-50'
					: ''}"
				name="message"
				placeholder={isVoiceTyping ? 'Listening...' : 'Ask me anything...'}
				title="Shit+Enter for a new line"
				maxlength={15000}
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
						submitButtonEle?.click()
					}
				}}
			/>

			{#if isVoiceTypingSupported}
				<button
					class="absolute top-0 right-[4rem] bottom-0 flex w-[3.5rem] cursor-pointer items-center justify-center text-xs font-semibold uppercase text-emerald-900 transition-all duration-150 hover:bg-emerald-300/25 active:bg-emerald-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-emerald-900/50 {isVoiceTyping
						? 'animate-ping !bg-transparent !text-emerald-500'
						: ''}"
					type="button"
					title="Type using voice"
					on:click={() => (isVoiceTyping ? recognition?.stop() : recognition?.start())}
					on:keydown={(e) => {
						if (e.key === 'Enter') {
							submitButtonEle?.click()
						}
					}}
					use:clickOutside={() => (isVoiceTyping ? recognition?.stop() : {})}
				>
					<MicSvg />
				</button>
			{/if}

			<button
				data-testid="send-button"
				class="absolute top-0 right-0 bottom-0 flex w-[4rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-emerald-900 transition-all duration-150 hover:bg-emerald-300/25 active:bg-emerald-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-emerald-900/50"
				type="submit"
				disabled={loading}
				bind:this={submitButtonEle}
			>
				<ArrowRightSvg />
			</button>
		</div>
	</div>

	<div
		class="mt-3 flex text-sm"
		title="Counts total tokens of the system prompt, the latest 14 messages, and the current value in the new message box. Maximum allowed is {maxTokens}."
	>
		<a
			class="pointer-events-auto fixed left-4 text-emerald-900/50 underline-offset-2 hover:underline"
			href="mailto:support@kal.chat">Feedback</a
		>
		<span class="flex-1" />
		{#if tokensActive > maxTokens}
			<span class="pointer-events-auto font-black text-red-500">{tokensActive - maxTokens}</span>
			<span class="pointer-events-auto font-semibold text-red-500">&nbsp;tokens over</span>
		{:else}
			<span class="pointer-events-auto font-semibold text-emerald-500">{tokensActive}</span>
			<span class="pointer-events-auto text-emerald-900/50">&nbsp;tokens active</span>
		{/if}
	</div>
</form>

<div bind:this={bottomEle} />

<div
	class="pointer-events-none fixed bottom-0 left-0 right-0 z-0 h-[8rem] bg-gradient-to-t from-emerald-50 to-emerald-50/0"
/>

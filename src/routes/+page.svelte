<script lang="ts">
	import { browser } from '$app/environment'
	import { enhance } from '$app/forms'
	import { clickOutside } from '$lib/actions/click-outside'
	import Header from '$lib/components/header.svelte'
	import Message from '$lib/components/message.svelte'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import RefreshSvg from '$lib/icons/refresh.svg.svelte'
	import { greetings } from '$lib/utils/greetings'
	import orderBy from 'lodash/orderBy'
	import { onMount, tick } from 'svelte'

	export let data
	export let form

	onMount(() => {
		scrollToBottom()
		setUpVoiceTyping()
	})

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
	let recognition: any

	$: messages = form?.messages ?? data.messages // TODO: remove `form?.messages ?? ` once DB is integrated

	const maxMessageBoxHeight = 420
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

	$: isVoiceTypingSupported = browser && 'webkitSpeechRecognition' in window

	async function setUpVoiceTyping() {
		if (isVoiceTyping || !('webkitSpeechRecognition' in window)) {
			return
		}
		recognition = new (window.webkitSpeechRecognition as any)()
		recognition.lang = 'en-US'
		recognition.continuous = true
		recognition.interimResults = true
		recognition.maxAlternatives = 1
		recognition.onstart = () => {
			originalMessage = message
			isVoiceTyping = true
		}
		recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
			message = `${originalMessage.replace(/ $/, '')} ${Array.from(event.results)
				.map((alternatives) =>
					!alternatives.isFinal
						? null
						: orderBy(alternatives, (a) => a.confidence, 'desc')[0].transcript.trim(),
				)
				.filter((a) => a !== null)
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

<main class="bg-gradient-to-t from-sky-50 to-sky-100 bg-fixed">
	<Header />

	<ul
		class="mx-auto flex min-h-screen max-w-[48rem] flex-col gap-6 p-4 pb-[calc(2rem+1rem+8rem)]"
		bind:this={messagesListEle}
	>
		<div class="min-h-[3.5rem] flex-1" />
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
					articleClassName="!animate-pulse !bg-transparent !bg-none !px-0 !text-sky-900 !shadow-none"
				/>
			{/key}
		{/if}
	</ul>

	<form
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 mx-auto h-[8rem] w-full max-w-[calc(4rem+48rem+4rem)] gap-1"
		method="POST"
		action="?/chat"
		on:reset|preventDefault={() => {
			if (
				messages.length <= 1 ||
				confirm(
					'Are you sure you want to start a new topic? Your current conversation will be lost.',
				)
			) {
				messages = [
					{ role: 'assistant', content: greetings[Math.floor(Math.random() * greetings.length)] },
				]
				messageBoxEle?.focus()
			}
		}}
		use:enhance={async ({ form }) => {
			if (loading) {
				return
			}
			loading = true

			const valueBackup = form.message.value

			messages = [...messages, { role: 'user', content: form.message.value }]
			message = ''

			await scrollToBottom()

			return async ({ result, update }) => {
				switch (result.type) {
					case 'error':
						alert(`Error: ${result.error?.message ?? 'Unknown cause'}`)
						messages = [...messages.slice(0, -1)]
						message = valueBackup + message
						break
					case 'failure':
						alert(`Failure: ${result.data?.message ?? 'Unknown cause'}`)
						messages = [...messages.slice(0, -1)]
						message = valueBackup + message
						break
					case 'success':
						messages = result.data?.messages ?? messages
						break
					case 'redirect':
						console.info(`Redirecting to: ${result.location}`)
						await update()
						break
					default:
						alert(`Failed to send your message.\nPlease, try again.`)
						messages = [...messages.slice(0, -1)]
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
			name="oldMessages"
			value={JSON.stringify(messages.slice(-10))}
			disabled={loading}
			readonly
		/>

		<div class="absolute left-4 right-4 bottom-[3.5rem] flex items-end gap-[calc(0.5rem+3px)]">
			<button
				class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent text-sky-900 shadow-lg shadow-sky-900/20 ring-2 ring-sky-600/75 backdrop-blur backdrop-saturate-200 transition-all duration-150 hover:bg-white/95 hover:shadow-sky-900/30 focus:bg-white/95 active:shadow-xl active:shadow-sky-900/20 active:ring-offset-2 active:ring-offset-sky-50 disabled:animate-pulse disabled:bg-sky-600/25 disabled:text-sky-900/50 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 disabled:backdrop-blur-sm disabled:backdrop-saturate-100"
				type="reset"
				title="New topic"
				disabled={loading}
			>
				<RefreshSvg />
			</button>

			<div class="group pointer-events-auto relative flex flex-1">
				<!-- svelte-ignore a11y-autofocus -->
				<textarea
					data-testid="message-box"
					class="h-[3.5rem] w-full min-w-0 flex-1 resize-none rounded-[1.75rem] bg-white/75 py-4 px-6 text-lg leading-[1.5rem] text-black shadow-lg shadow-sky-900/20 outline-none ring-2 ring-sky-600/75 backdrop-blur backdrop-saturate-200 transition-all duration-150 placeholder:text-sky-700/50 read-only:ring-0 read-only:ring-offset-0 hover:bg-white/95 hover:shadow-sky-900/30 focus:bg-white/95 focus:shadow-xl focus:shadow-sky-900/20 focus:ring-offset-2 focus:ring-offset-sky-50 disabled:animate-pulse disabled:bg-sky-600/25 disabled:text-sky-900/50 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 disabled:backdrop-blur-sm disabled:backdrop-saturate-100 {isVoiceTypingSupported
						? 'pr-[calc(1.5rem+3.5rem+3.5rem)]'
						: 'pr-[calc(1.5rem+3.5rem)]'} {isVoiceTyping ? 'animate-pulse' : ''}"
					name="message"
					placeholder="Ask me anything..."
					title="Shit+Enter for a new line"
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

				{#if isVoiceTypingSupported}
					<button
						class="absolute top-0 right-[3.5rem] bottom-0 flex w-[3.5rem] cursor-pointer items-center justify-center text-xs font-semibold uppercase text-sky-900 transition-all duration-150 hover:bg-sky-300/25 active:bg-sky-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-sky-900/50 {isVoiceTyping
							? 'animate-ping !bg-transparent !text-sky-500'
							: ''}"
						type="button"
						title="Type using voice"
						on:click={() => (isVoiceTyping ? recognition?.stop() : recognition?.start())}
						on:keydown={(e) => {
							if (e.key === 'Enter') {
								e.currentTarget.form?.submitButton?.click()
							}
						}}
						use:clickOutside={() => (isVoiceTyping ? recognition?.stop() : {})}
					>
						<MicSvg />
					</button>
				{/if}

				<button
					data-testid="send-button"
					class="absolute top-0 right-0 bottom-0 flex w-[3.5rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-sky-900 transition-all duration-150 hover:bg-sky-300/25 active:bg-sky-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-sky-900/50"
					type="submit"
					name="submitButton"
					disabled={loading}
				>
					<ArrowRightSvg />
				</button>
			</div>

			<div
				class="transition-all {innerWidth === 0 ||
				innerWidth >= (innerWidth < 640 ? 14 : 16) * (4 + 48 + 4)
					? 'w-[3.5rem]'
					: 'w-0'}"
			/>
		</div>
	</form>

	<div bind:this={bottomEle} />

	<div
		class="pointer-events-none fixed bottom-0 left-0 right-0 z-0 h-[8rem] bg-gradient-to-t from-sky-50 to-sky-50/0"
	/>
</main>

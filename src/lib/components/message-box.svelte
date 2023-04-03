<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import PlusSvg from '$lib/icons/plus.svg.svelte'
	import { latestNewMessageSentAt } from '$lib/stores/latest-new-message-sent-at'
	import { maxTokensForUser, smallScreenThresholdInPx } from '$lib/utils/constants'
	import Bowser from 'bowser'
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte'
	import { fade } from 'svelte/transition'
	import type { PageData } from '../../routes/topic/[id]/$types'

	export let data: PageData
	export let innerWidth: number
	export let innerHeight: number
	export let isSideBarOpen: boolean
	export let isSendingMessage: boolean
	export let message: string
	export let tokensActive: number

	const dispatch = createEventDispatcher<{
		scrollToBottom: undefined
	}>()

	onMount(async () => {
		isCreatingTopic = false
		page.subscribe(() => {
			isCreatingTopic = false
		})

		setUpVoiceTyping()

		focusOnInput()
		if (browser) {
			window.addEventListener('focus', () => {
				focusOnInput()
			})
		}

		const q = $page.url.searchParams.get('q') ?? null
		if (browser && q && data.topic.Message.length === 1 && messageBoxEle && submitButtonEle) {
			message = q
			await tick()
			submitButtonEle.click()
			await tick()
			message = ''
		}
		if (q) {
			$page.url.searchParams.delete('q')
			await goto($page.url)
		}
	})

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('focus', () => {
				focusOnInput()
			})
		}
	})

	let isCreatingTopic = false
	let messageBoxEle: HTMLTextAreaElement | null = null
	let submitButtonEle: HTMLButtonElement | null = null

	$: maxMessageBoxHeight = innerHeight ? innerHeight / 2 : 420
	$: {
		;[
			innerWidth,
			innerHeight,
			message,
			isSendingMessage,
			isVoiceTyping,
			isSideBarOpen,
			isCreatingTopic,
			$latestNewMessageSentAt,
			$page,
			data.topic.Message,
		] // deps
		adjustMessageBoxHeight()
	}
	async function adjustMessageBoxHeight(repeat = true) {
		if (!messageBoxEle) {
			return
		}

		await tick()

		messageBoxEle.style.height = `${Math.min(messageBoxEle.scrollHeight, maxMessageBoxHeight)}px`
		messageBoxEle.style.maxHeight = `${maxMessageBoxHeight}px`
		messageBoxEle.style.overflowY =
			messageBoxEle.scrollHeight < maxMessageBoxHeight ? 'hidden' : 'auto'

		const heightBackup = messageBoxEle.style.height
		messageBoxEle.classList.remove('transition-all')
		messageBoxEle.style.height = `3.5rem`

		const newHeight = `${messageBoxEle.scrollHeight}px`
		messageBoxEle.style.height = heightBackup
		;[messageBoxEle.scrollHeight] // deps (I know... weird, but it works)

		messageBoxEle.classList.add('transition-all')
		messageBoxEle.style.height = newHeight

		if (repeat) {
			setTimeout(() => {
				adjustMessageBoxHeight(false)
			}, 150)
		}
	}

	$: userAgentParser = Bowser.getParser(
		browser ? window.navigator.userAgent : data.userAgent ?? ' ',
	)

	function focusOnInput() {
		if (messageBoxEle) {
			messageBoxEle.focus()
		}
	}

	async function sendNewMessage() {
		if (isSendingMessage) {
			return
		}
		isSendingMessage = true

		await tick()
		messageBoxEle?.focus()

		const messageBackup = message

		const topic = data.topics.find((t) => t.id === Number($page.params.id))
		if (topic) {
			topic.updatedAt = new Date()
			data.topics = [topic, ...(data.topics.filter((t) => t.id !== Number($page.params.id)) ?? [])]
		}

		data.topic.Message = [
			...data.topic.Message,
			{
				id: data.topic.Message[data.topic.Message.length - 1]
					? data.topic.Message[data.topic.Message.length - 1].id + 1
					: 0, // to be replaced
				createdAt: new Date(), // to be replaced
				updatedAt: new Date(), // to be replaced
				role: 'user',
				content: message,
				topicId: Number($page.params.id), // to be replaced
			},
		]

		message = ''
		await tick()

		dispatch('scrollToBottom')

		const response = await fetch(`/topic/${$page.params.id}/new-message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				topicId: Number($page.params.id),
				message: messageBackup,
			}),
		})

		let result: {
			message?: string // for errors
			topic?: typeof data.topic
			topics?: typeof data.topics
		} | null = null
		try {
			result = await response.json()
		} catch {
			alert(`Error: ${response.statusText ?? 'Unknown cause'}`)
		}

		if (!response.ok) {
			alert(`Error: ${result?.message ?? 'Unknown cause'}`)
			data.topic.Message = data.topic.Message.slice(0, -1)
			message = messageBackup + message
		} else {
			data.topic = result?.topic ?? data.topic
			data.topics = result?.topics ?? data.topics
		}

		dispatch('scrollToBottom')

		isSendingMessage = false

		$latestNewMessageSentAt = Date.now()
	}

	let isVoiceTyping = false
	let originalMessage = message
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any
	$: isBlacklistedBrowserForVoiceInput =
		userAgentParser.getOS().name === 'Android' ||
		(userAgentParser.getOS().name === 'macOS' &&
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
					Array.from(alternatives)
						.sort(
							(a, b) => (a.confidence < b.confidence ? 1 : a.confidence > b.confidence ? -1 : 0), // desc
						)[0]
						.transcript.trim(),
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

<div
	class="pointer-events-none fixed bottom-0 right-0 z-10 bg-gradient-to-t from-primary-50 to-primary-500/0 px-4 transition-all lg:px-6 {isSideBarOpen &&
	innerWidth > smallScreenThresholdInPx
		? 'left-[18rem]'
		: 'left-0'}"
>
	<div
		class="mx-auto flex w-full max-w-[calc(4rem+56rem+4rem-3rem)] items-end gap-[calc(0.5rem+1px)]"
	>
		<a
			data-sveltekit-preload-data="off"
			class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 transform-gpu cursor-pointer appearance-none items-center justify-center rounded-full bg-white/90 text-primary-900 shadow-lg shadow-primary-900/20 outline-none ring-2 ring-primary-600/75 transition-all hover:bg-white hover:shadow-primary-900/30 focus:bg-white active:shadow-xl active:shadow-primary-900/20 active:ring-primary-600 active:ring-offset-2 active:ring-offset-primary-100 sm:backdrop-blur-sm lg:backdrop-blur {isCreatingTopic
				? 'animate-pulse cursor-default bg-primary-600/25 text-primary-900/50 shadow-none ring-0'
				: ''}"
			title="New topic"
			href="/topic/new"
			on:click={(e) => {
				if (!isCreatingTopic) {
					isCreatingTopic = true
				} else {
					e.preventDefault()
				}
			}}
		>
			<PlusSvg />
		</a>

		<div class="group relative flex flex-1">
			<!-- svelte-ignore a11y-autofocus -->
			<textarea
				data-testid="message-box"
				class="form-textarea pointer-events-auto flex h-[3.5rem] w-full min-w-0 flex-1 transform-gpu resize-none appearance-none rounded-[1.75rem] border-none bg-white/90 px-6 py-4 text-lg leading-[1.5rem] text-black shadow-lg shadow-primary-900/20 outline-none ring-2 ring-primary-600/75 transition-all placeholder:text-primary-700/50 read-only:ring-0 hover:bg-white hover:shadow-primary-900/30 focus:bg-white focus:shadow-xl focus:shadow-primary-900/20 focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-primary-100 disabled:animate-pulse disabled:bg-primary-600/25 disabled:text-primary-900/50 disabled:shadow-none disabled:ring-0 sm:backdrop-blur-sm lg:backdrop-blur {isVoiceTypingSupported
					? 'pr-[calc(1.5rem+3.5rem+4rem)]'
					: 'pr-[calc(1.5rem+4rem)]'} {isVoiceTyping ? 'animate-pulse' : ''} {tokensActive >
				maxTokensForUser
					? '!ring-red-600/75'
					: ''}"
				name="message"
				placeholder={isVoiceTyping ? 'Listening...' : 'Ask me anything...'}
				title="For a new line, use any one of Shift+Enter, Ctrl/Cmd+Enter, or Alt/Option+Enter"
				maxlength={15000}
				autocapitalize="sentences"
				autocorrect="on"
				spellcheck="true"
				autocomplete="off"
				tabindex="-1"
				autofocus
				required
				bind:this={messageBoxEle}
				bind:value={message}
				on:input={() => adjustMessageBoxHeight(true)}
				on:keydown={async (e) => {
					if (e.key === 'Enter') {
						if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
							e.preventDefault()
							const cursorPosition = e.currentTarget.selectionStart
							message = `${message.slice(0, cursorPosition)}\n${message.slice(cursorPosition)}`
							await tick()
							e.currentTarget.selectionStart = cursorPosition + 1
							e.currentTarget.selectionEnd = cursorPosition + 1
						} else if (!message.trim()) {
							e.preventDefault()
						} else {
							e.preventDefault()
							sendNewMessage()
						}
					}
				}}
			/>

			{#if isVoiceTypingSupported}
				<button
					class="pointer-events-auto absolute bottom-0 right-[4rem] top-0 flex w-[3.5rem] cursor-pointer items-center justify-center text-xs font-semibold uppercase text-primary-900 outline-primary-600 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-primary-900/50 {isVoiceTyping
						? 'animate-ping !bg-transparent !text-primary-500'
						: ''}"
					type="button"
					title="Type using voice"
					on:click={() => (isVoiceTyping ? recognition?.stop() : recognition?.start())}
					on:keydown={(e) => (e.key === 'Enter' ? submitButtonEle?.click() : {})}
					use:clickOutside={() => (isVoiceTyping ? recognition?.stop() : {})}
				>
					<MicSvg />
				</button>
			{/if}

			<button
				data-testid="send-button"
				class="pointer-events-auto absolute bottom-0 right-0 top-0 flex w-[4rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-primary-900 outline-primary-600 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-primary-900/50"
				type="button"
				disabled={isSendingMessage}
				bind:this={submitButtonEle}
				on:click={() => sendNewMessage()}
			>
				<ArrowRightSvg />
			</button>
		</div>
	</div>

	<div
		class="flex gap-4 py-5 text-sm"
		title="Counts total 'tokens' used by the system prompt, the latest {data.contextLength} messages, and the current value in the new message box. Maximum allowed is {maxTokensForUser}."
	>
		<a
			class="pointer-events-auto text-primary-900/75 underline-offset-2 hover:underline lg:left-6"
			href="mailto:support@kal.chat"
			target="_blank"
			title="Send feedback to feedback@kal.chat"
		>
			Send Feedback
		</a>
		<span class="flex-1" />
		{#if tokensActive > 0}
			{#if tokensActive > maxTokensForUser}
				<span class="pointer-events-auto text-red-500/95" transition:fade={{ duration: 150 }}>
					<span class="font-black"
						>{Intl.NumberFormat().format(tokensActive - maxTokensForUser)}</span
					> words over
				</span>
			{:else}
				<span class="pointer-events-auto text-primary-900/50" transition:fade={{ duration: 150 }}>
					<span
						class="font-semibold {tokensActive > maxTokensForUser - maxTokensForUser / 10
							? 'text-amber-500/95'
							: 'text-emerald-500/95'}"
						>{Intl.NumberFormat().format(maxTokensForUser - tokensActive)}</span
					> words left
				</span>
			{/if}
		{/if}
	</div>
</div>

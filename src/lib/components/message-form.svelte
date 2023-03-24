<script lang="ts">
	import { browser } from '$app/environment'
	import { enhance } from '$app/forms'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import PlusSvg from '$lib/icons/plus.svg.svelte'
	import { latestNewMessageSentAt } from '$lib/stores/latest-new-message-sent-at'
	import { maxTokens } from '$lib/utils/constants'
	import Bowser from 'bowser'
	import orderBy from 'lodash/orderBy'
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte'
	import { fade } from 'svelte/transition'
	import type { PageData } from '../../routes/thread/[id]/$types'

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
		isCreatingThread = false
		page.subscribe(() => {
			isCreatingThread = false
		})

		setUpVoiceTyping()

		focusOnInput()
		if (browser) {
			window.addEventListener('focus', () => {
				focusOnInput()
			})
		}

		const q = $page.url.searchParams.get('q') ?? null
		if (browser && q && data.thread.Message.length === 1 && messageBoxEle && submitButtonEle) {
			messageBoxEle.value = q
			submitButtonEle.click()
			await tick()
			messageBoxEle.value = ''
		}
	})

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('focus', () => {
				focusOnInput()
			})
		}
	})

	let isCreatingThread = false
	let messageBoxEle: HTMLTextAreaElement | null = null
	let submitButtonEle: HTMLButtonElement | null = null

	$: maxMessageBoxHeight = innerHeight ? innerHeight / 2 : 420
	$: {
		;[innerWidth, innerHeight, message, isSendingMessage, isVoiceTyping] // deps
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

	$: userAgentParser = Bowser.getParser(
		browser ? window.navigator.userAgent : data.userAgent ?? ' ',
	)

	function focusOnInput() {
		if (messageBoxEle) {
			messageBoxEle.focus()
		}
	}

	let isVoiceTyping = false
	let originalMessage = message
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any
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

<form
	class="pointer-events-none fixed right-0 bottom-0 z-10 bg-gradient-to-t from-primary-50 to-primary-500/0 px-4 transition-all lg:px-6 {isSideBarOpen
		? 'left-[18rem]'
		: 'left-0'}"
	method="POST"
	action="?/newMessage"
	use:enhance={async ({ form }) => {
		if (isSendingMessage) {
			return
		}
		isSendingMessage = true

		const valueBackup = form.message.value

		const thread = data.threads.find((t) => t.id === Number($page.params.id))
		if (thread) {
			thread.updatedAt = new Date()
			data.threads = [
				thread,
				...(data.threads.filter((t) => t.id !== Number($page.params.id)) ?? []),
			]
		}

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

		dispatch('scrollToBottom')

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
					data.threads = result.data?.threads ?? data.thread
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

			dispatch('scrollToBottom')

			isSendingMessage = false
			await tick()
			messageBoxEle?.focus()

			$latestNewMessageSentAt = Date.now()
		}
	}}
>
	<input
		class="hidden"
		type="hidden"
		name="threadId"
		value={data.thread.id}
		disabled={isSendingMessage}
		readonly
	/>

	<div
		class="mx-auto flex w-full max-w-[calc(4rem+56rem+4rem-3rem)] items-end gap-[calc(0.5rem+1px)]"
	>
		<a
			data-sveltekit-preload-data="tap"
			class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 transform-gpu cursor-pointer items-center justify-center rounded-full bg-white/90 text-primary-900 shadow-lg shadow-primary-900/20 ring-2 ring-primary-600/75 transition-all hover:bg-white hover:shadow-primary-900/30 focus:bg-white active:shadow-xl active:shadow-primary-900/20 active:ring-offset-2 active:ring-offset-primary-50 sm:backdrop-blur-sm lg:backdrop-blur {isCreatingThread
				? 'animate-pulse cursor-default bg-primary-600/25 text-primary-900/50 shadow-none ring-0 ring-offset-0'
				: ''}"
			title="New thread"
			href="/thread/new"
			on:click={(e) => {
				if (!isCreatingThread) {
					isCreatingThread = true
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
				class="pointer-events-auto h-[3.5rem] w-full min-w-0 flex-1 transform-gpu resize-none rounded-[1.75rem] bg-white/90 py-4 px-6 text-lg leading-[1.5rem] text-black shadow-lg shadow-primary-900/20 outline-none ring-2 ring-primary-600/75 transition-all placeholder:text-primary-700/50 read-only:ring-0 read-only:ring-offset-0 hover:bg-white hover:shadow-primary-900/30 focus:bg-white focus:shadow-xl focus:shadow-primary-900/20 focus:ring-offset-2 focus:ring-offset-primary-50 disabled:animate-pulse disabled:bg-primary-600/25 disabled:text-primary-900/50 disabled:shadow-none disabled:ring-0 disabled:ring-offset-0 sm:backdrop-blur-sm lg:backdrop-blur {isVoiceTypingSupported
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
					class="pointer-events-auto absolute top-0 right-[4rem] bottom-0 flex w-[3.5rem] cursor-pointer items-center justify-center text-xs font-semibold uppercase text-primary-900 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-primary-900/50 {isVoiceTyping
						? 'animate-ping !bg-transparent !text-primary-500'
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
				class="pointer-events-auto absolute top-0 right-0 bottom-0 flex w-[4rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-primary-900 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:bg-transparent disabled:text-primary-900/50"
				type="submit"
				disabled={isSendingMessage}
				bind:this={submitButtonEle}
			>
				<ArrowRightSvg />
			</button>
		</div>
	</div>

	<div
		class="flex gap-4 py-5 text-sm"
		title="Counts total 'tokens' used by the system prompt, the latest {data.contextLength} messages, and the current value in the new message box. Maximum allowed is {maxTokens}."
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
			{#if tokensActive > maxTokens}
				<span class="pointer-events-auto text-red-500/95" transition:fade={{ duration: 150 }}>
					<span class="font-black">{Intl.NumberFormat().format(tokensActive - maxTokens)}</span> words
					over
				</span>
			{:else}
				<span class="pointer-events-auto text-primary-900/50" transition:fade={{ duration: 150 }}>
					<span
						class="font-semibold {tokensActive > maxTokens - maxTokens / 10
							? 'text-amber-500/95'
							: 'text-emerald-500/95'}">{Intl.NumberFormat().format(maxTokens - tokensActive)}</span
					> words left
				</span>
			{/if}
		{/if}
	</div>
</form>

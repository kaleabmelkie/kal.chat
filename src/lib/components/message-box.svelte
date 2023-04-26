<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { clickOutside } from '$lib/actions/click-outside'
	import ArrowRightSvg from '$lib/icons/arrow-right.svg.svelte'
	import MicSvg from '$lib/icons/mic.svg.svelte'
	import PlusSvg from '$lib/icons/plus.svg.svelte'
	import { chatStore } from '$lib/stores/chat-store'
	import type { NewMessageOkResponseBody } from '$lib/types/new-message-types'
	import { maxTokensForUser, smallScreenThresholdInPx } from '$lib/utils/constants'
	import Bowser from 'bowser'
	import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte'
	import { fade } from 'svelte/transition'

	const dispatch = createEventDispatcher<{
		scrollToBottom: undefined
	}>()

	onMount(async () => {
		if (!$chatStore) {
			return
		}

		$chatStore.newTopic.isCreating = false
		page.subscribe(() => {
			if (!$chatStore) {
				return
			}
			$chatStore.newTopic.isCreating = false
		})

		setUpVoiceTyping()

		focusOnInput()
		if (browser) {
			window.addEventListener('focus', focusOnInput)
		}

		const q = $page.url.searchParams.get('q') ?? null
		if (
			browser &&
			q &&
			$chatStore.activeTopic.messages.length === 1 &&
			messageBoxEle &&
			submitButtonEle
		) {
			$chatStore.activeTopic.newMessage.content = q
			await tick()
			submitButtonEle.click()
			await tick()
			$chatStore.activeTopic.newMessage.content = ''
		}
		if (q) {
			$page.url.searchParams.delete('q')
			await goto($page.url)
		}
	})

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('focus', focusOnInput)
		}
	})

	let messageBoxEle: HTMLTextAreaElement | null = null
	let submitButtonEle: HTMLButtonElement | null = null

	$: maxMessageBoxHeight = $chatStore?.window.innerHeight ? $chatStore.window.innerHeight / 2 : 420
	$: {
		;[
			$chatStore?.activeTopic.messages.length,
			$chatStore?.activeTopic.newMessage.queue.length,
			$chatStore?.activeTopic.newMessage.content,
			$chatStore?.activeTopic.newMessage.isVoiceTyping,
			$chatStore?.newTopic.isCreating,
			$chatStore?.sideBar.isOpen,
			$chatStore?.window.innerWidth,
			$chatStore?.window.innerHeight,
			$page,
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
		browser ? window.navigator.userAgent : $chatStore?.window.userAgentFromHeader || ' ',
	)

	function focusOnInput() {
		if (messageBoxEle) {
			messageBoxEle.focus()
		}
	}

	async function sendNewMessage() {
		if (!$chatStore) {
			return
		}

		if ($chatStore.activeTopic.newMessage.queue.length) {
			return
		}

		messageBoxEle?.focus()

		$chatStore.activeTopic.newMessage.queue = [$chatStore.activeTopic.newMessage.content]
		$chatStore.activeTopic.newMessage.content = ''

		await tick()

		dispatch('scrollToBottom')

		try {
			const response = await fetch(`/topic/${$page.params.id}/new-message`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					topicId: $chatStore.activeTopic.id,
					message: $chatStore.activeTopic.newMessage.queue[0],
				}),
			})

			let result: App.Error | NewMessageOkResponseBody | null = null
			try {
				result = await response.json()
			} catch {
				throw new Error('Unable to parse new message response')
			}

			if (!response.ok) {
				throw new Error((result as App.Error)?.message ?? 'Unknown error')
			} else {
				$chatStore.activeTopic.messages = [
					...$chatStore.activeTopic.messages,
					...(result as NewMessageOkResponseBody).newMessages,
				]

				$chatStore.activeTopic.newMessage.queue = []

				const topicHistoryIndex = $chatStore.topicsHistory.findIndex(
					(t) => t.id === $chatStore?.activeTopic.id,
				)
				if (topicHistoryIndex >= 0) {
					$chatStore.topicsHistory[topicHistoryIndex].updatedAt = new Date(
						(result as NewMessageOkResponseBody).topicHistoryUpdatedAtIso,
					)
					$chatStore.topicsHistory[topicHistoryIndex].messagesCount += (
						result as NewMessageOkResponseBody
					).newMessages.length
				}
			}

			dispatch('scrollToBottom')
		} catch (error) {
			console.error('New message error:', error)
			alert(`Error: ${(error as Error).message}`)

			$chatStore.activeTopic.newMessage.content = $chatStore.activeTopic.newMessage.queue[0] ?? ''
		} finally {
			$chatStore.activeTopic.newMessage.queue = []
		}
	}

	let newMessageContentBeforeVoice = ''
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any
	$: isBlacklistedBrowserForVoiceInput =
		userAgentParser.getOS().name === 'Android' ||
		(userAgentParser.getOS().name === 'macOS' &&
			userAgentParser.getBrowserName() === 'Microsoft Edge')
	$: isVoiceTypingSupported =
		browser && 'webkitSpeechRecognition' in window && !isBlacklistedBrowserForVoiceInput
	async function setUpVoiceTyping() {
		if (!$chatStore) {
			return
		}
		if (
			$chatStore.activeTopic.newMessage.isVoiceTyping ||
			!isVoiceTypingSupported ||
			!('webkitSpeechRecognition' in window)
		) {
			return
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		recognition = new (window.webkitSpeechRecognition as any)()
		recognition.lang = 'en'
		recognition.continuous = true
		recognition.interimResults = true
		recognition.onstart = () => {
			if (!$chatStore) {
				recognition.stop()
				return
			}
			$chatStore.activeTopic.newMessage.isVoiceTyping = true
			newMessageContentBeforeVoice = $chatStore.activeTopic.newMessage.content
		}
		// eslint-disable-next-line no-undef
		recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
			if (!$chatStore) {
				recognition.stop()
				return
			}
			$chatStore.activeTopic.newMessage.content = `${newMessageContentBeforeVoice.replace(
				/ $/,
				'',
			)} ${Array.from(event.results)
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
			if (!$chatStore) {
				recognition.stop()
				return
			}
			if (!['aborted', 'no-speech'].includes(event.error)) {
				console.error('Speech recognition error:', event)
				alert(`Speech recognition error: ${event?.error ?? 'Unknown error'}`)
			}
			$chatStore.activeTopic.newMessage.isVoiceTyping = false
			newMessageContentBeforeVoice = ''
			await tick()
			messageBoxEle?.focus()
		}
		recognition.onend = async () => {
			if (!$chatStore) {
				return
			}
			$chatStore.activeTopic.newMessage.isVoiceTyping = false
			newMessageContentBeforeVoice = ''
			await tick()
			messageBoxEle?.focus()
		}
	}
</script>

<div
	class="pointer-events-none fixed bottom-0 right-0 z-10 bg-gradient-to-t from-primary-50 px-4 transition-all dark:from-black lg:px-6 {$chatStore
		?.sideBar.isOpen && $chatStore.window.innerWidth > smallScreenThresholdInPx
		? 'left-[18rem]'
		: 'left-0'}"
>
	<div
		class="mx-auto flex w-full max-w-[calc(4rem+56rem+4rem-3rem)] items-end gap-[calc(0.5rem+1px)]"
	>
		<a
			data-sveltekit-preload-data="off"
			class="pointer-events-auto flex h-[3.5rem] w-[3.5rem] flex-shrink-0 transform-gpu cursor-pointer appearance-none items-center justify-center rounded-full bg-white/90 text-primary-900 shadow-lg shadow-primary-900/20 outline-none ring-2 ring-primary-600/75 backdrop-blur transition-all hover:bg-white hover:shadow-primary-900/30 focus:bg-white active:shadow-xl active:shadow-primary-900/10 active:ring-primary-600 active:ring-offset-2 active:ring-offset-primary-100 dark:bg-primary-950/50 dark:text-primary-100 dark:!ring-primary-500 dark:ring-primary-500/75 dark:!ring-offset-primary-950/75 dark:hover:bg-primary-900/75 dark:focus:bg-primary-900/75 {$chatStore
				?.newTopic.isCreating
				? 'animate-pulse cursor-default bg-primary-600/25 text-primary-900/50 shadow-none ring-0'
				: ''}"
			title="New topic"
			href="/topic/new"
			on:click={(e) => {
				if (!$chatStore) {
					return
				}
				if (!$chatStore.newTopic.isCreating) {
					$chatStore.newTopic.isCreating = true
				} else {
					e.preventDefault()
				}
			}}
		>
			<PlusSvg />
		</a>

		<div class="group relative flex flex-1">
			{#if $chatStore}
				<!-- svelte-ignore a11y-autofocus -->
				<textarea
					data-testid="message-box"
					class="form-textarea pointer-events-auto flex h-[3.5rem] w-full min-w-0 flex-1 transform-gpu resize-none appearance-none rounded-[1.75rem] border-none bg-white/90 px-6 py-4 text-lg leading-[1.5rem] text-black shadow-lg shadow-primary-900/20 outline-none ring-2 ring-primary-600/75 backdrop-blur transition-all placeholder:text-primary-700/50 read-only:ring-0 hover:bg-white hover:shadow-primary-900/30 focus:bg-white focus:shadow-xl focus:shadow-primary-900/20 focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-primary-100 disabled:animate-pulse disabled:bg-primary-600/25 disabled:text-primary-900/50 disabled:shadow-none disabled:ring-0 dark:bg-primary-950/50 dark:text-white dark:!ring-primary-500 dark:ring-primary-500/75 dark:!ring-offset-primary-950/75 dark:placeholder:text-primary-300/75 dark:hover:bg-primary-950/50 dark:focus:bg-primary-950/50 {isVoiceTypingSupported
						? 'pr-[calc(1.5rem+3.5rem+4rem)]'
						: 'pr-[calc(1.5rem+4rem)]'} {$chatStore.activeTopic.tokensCountInContext >
					maxTokensForUser
						? '!ring-red-600/75'
						: ''}"
					name="message"
					placeholder={$chatStore.activeTopic.newMessage.isVoiceTyping
						? 'Listening...'
						: 'Ask me anything...'}
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
					bind:value={$chatStore.activeTopic.newMessage.content}
					on:input={() => adjustMessageBoxHeight(true)}
					on:keydown={async (e) => {
						if (!$chatStore) {
							return
						}
						if (e.key === 'Enter') {
							if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
								e.preventDefault()
								const cursorPosition = e.currentTarget.selectionStart
								$chatStore.activeTopic.newMessage.content = `${$chatStore.activeTopic.newMessage.content.slice(
									0,
									cursorPosition,
								)}\n${$chatStore.activeTopic.newMessage.content.slice(cursorPosition)}`
								await tick()
								e.currentTarget.selectionStart = cursorPosition + 1
								e.currentTarget.selectionEnd = cursorPosition + 1
							} else if (!$chatStore.activeTopic.newMessage.content.trim()) {
								e.preventDefault()
							} else {
								e.preventDefault()
								sendNewMessage()
							}
						}
					}}
				/>
			{/if}

			{#if isVoiceTypingSupported}
				<button
					class="pointer-events-auto absolute bottom-0 right-[4rem] top-0 flex w-[3.5rem] cursor-pointer items-center justify-center text-xs font-semibold uppercase text-primary-900 outline-primary-600 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:!bg-transparent disabled:text-primary-900/50 dark:text-primary-100 dark:hover:bg-primary-700/25 dark:active:bg-primary-700/50 {$chatStore
						?.activeTopic.newMessage.isVoiceTyping
						? 'animate-pulse !bg-transparent !text-primary-500'
						: ''}"
					type="button"
					title="Type using voice"
					on:click={() =>
						$chatStore?.activeTopic.newMessage.isVoiceTyping
							? recognition?.stop()
							: recognition?.start()}
					on:keydown={(e) => (e.key === 'Enter' ? submitButtonEle?.click() : {})}
					use:clickOutside={() =>
						$chatStore?.activeTopic.newMessage.isVoiceTyping ? recognition?.stop() : {}}
				>
					<MicSvg />
				</button>
			{/if}

			<button
				data-testid="send-button"
				class="pointer-events-auto absolute bottom-0 right-0 top-0 flex w-[4rem] cursor-pointer items-center justify-center rounded-r-[1.75rem] text-xs font-semibold uppercase text-primary-900 outline-primary-600 transition-all hover:bg-primary-300/25 active:bg-primary-300/50 disabled:cursor-default disabled:!bg-transparent disabled:text-primary-900/50 dark:text-primary-100 dark:hover:bg-primary-700/25 dark:active:bg-primary-700/50"
				type="button"
				disabled={!$chatStore || $chatStore.activeTopic.newMessage.queue.length > 0}
				bind:this={submitButtonEle}
				on:click={() => sendNewMessage()}
			>
				<ArrowRightSvg />
			</button>
		</div>
	</div>

	<div
		class="flex gap-4 py-5 text-sm"
		title="Counts total 'tokens' used by the system prompt, the latest {$chatStore?.activeTopic
			.messagesCountInContext ??
			0} messages, and the current value in the new message box. Maximum allowed is {maxTokensForUser}."
	>
		<a
			class="pointer-events-auto text-primary-900/75 underline-offset-2 hover:underline dark:text-primary-100/75 lg:left-6"
			href="mailto:support@kal.chat"
			target="_blank"
			title="Send feedback to feedback@kal.chat"
		>
			Send Feedback
		</a>
		<span class="flex-1" />
		{#if $chatStore && $chatStore.activeTopic.tokensCountInContext > 0}
			{#if $chatStore.activeTopic.tokensCountInContext > maxTokensForUser}
				<span class="pointer-events-auto text-red-500/95" in:fade={{ duration: 150 }}>
					<span class="font-black"
						>{Intl.NumberFormat().format(
							$chatStore.activeTopic.tokensCountInContext - maxTokensForUser,
						)}</span
					> words over
				</span>
			{:else}
				<span
					class="pointer-events-auto text-primary-900/50 dark:text-primary-100/50"
					in:fade={{ duration: 150 }}
				>
					<span
						class="font-semibold {$chatStore.activeTopic.tokensCountInContext >
						maxTokensForUser - maxTokensForUser / 10
							? 'text-amber-500/95'
							: 'text-emerald-500/95'}"
						>{Intl.NumberFormat().format(
							maxTokensForUser - $chatStore.activeTopic.tokensCountInContext,
						)}</span
					> words left
				</span>
			{/if}
		{/if}
	</div>
</div>

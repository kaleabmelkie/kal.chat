<script lang="ts">
	import Message from '$lib/components/message.svelte'
	import type { SelectTopic } from '$lib/drizzle/schema/topics.server'
	import { chatStore, type ChatStoreType } from '$lib/stores/chat-store'
	import { err, toast } from '$lib/stores/toasts-store'
	import { messagesCountInContext } from '$lib/utils/constants'
	import { onDestroy, onMount } from 'svelte'

	onMount(() => {
		typingDotInterval = setInterval(() => {
			typingDotCount = (typingDotCount + 1) % 4
		}, 150) as unknown as number
	})

	onDestroy(() => {
		if (typingDotInterval !== null) {
			clearInterval(typingDotInterval)
		}
	})

	let isChangingResponseMode = false

	async function changeResponseModeTo(newResponseMode: SelectTopic['responseMode']) {
		if (!$chatStore?.session) {
			await err(`You must be logged in to change a topic's response mode`)
			return
		}
		if (
			newResponseMode === 'better' &&
			$chatStore.session.user.plan === 'free' &&
			!$chatStore.session.user.ownOpenaiApiKey
		) {
			await err(
				'You must either upgrade to a paid plan or provide your own OpenAI API key (in Advanced Settings) to use the better response mode',
			)
			return
		}

		if ($chatStore.activeTopic.responseMode === newResponseMode) {
			await toast(`Responses are already ${newResponseMode} in this topic`)
			return
		}

		isChangingResponseMode = true
		try {
			const response = await fetch(`/topic/${$chatStore.activeTopic.id}/change-response-mode`, {
				method: 'PUT',
				body: JSON.stringify({
					responseMode: newResponseMode,
				}),
			})
			if (!response.ok) {
				throw new Error(
					`${response.statusText} (${response.status}): ${
						(await response.json())?.message ?? 'Unknown'
					}`,
				)
			}
			const { message } = await response.json()
			await toast(message)

			$chatStore.activeTopic.responseMode = newResponseMode
		} catch (e) {
			err(e as Error)
		} finally {
			isChangingResponseMode = false
		}
	}

	let typingDotInterval: number | null = null
	let typingDotCount = 0

	$: messagesToShow = [
		...($chatStore?.activeTopic.messages.filter((m) => m.role !== 'system') ?? []),

		...(($chatStore?.activeTopic.newMessage.queue.length
			? [
					...$chatStore.activeTopic.newMessage.queue.map(
						(content, index) =>
							({
								id: -2 - index,
								role: 'user' as const,
								content,
							} satisfies ChatStoreType['activeTopic']['messages'][number]),
					),
					{
						id: -1,
						role: 'system' as const,
						content: 'Typing', // to be replaced in the template
					},
			  ]
			: []) satisfies ChatStoreType['activeTopic']['messages']),
	]
</script>

<ul
	class="mx-auto flex min-h-full max-w-[56rem] flex-col gap-6 px-4 pb-[calc(4rem+7.25rem)] lg:px-6"
>
	<div class="min-h-[calc(4.75rem+3.5rem)] flex-1" />

	<div class="grid gap-4 pb-12">
		<div class="text-sm text-primary-700 opacity-80 dark:text-primary-300">Choose mode:</div>

		<div class="mr-auto grid grid-cols-2 gap-2">
			<button
				class="button flex flex-col items-start justify-start gap-1 rounded-lg text-left {$chatStore
					?.activeTopic.responseMode === 'faster'
					? 'button-disabled !bg-primary-600/90 !text-white'
					: ''} {isChangingResponseMode ? 'button-loading' : ''}"
				type="button"
				disabled={isChangingResponseMode || $chatStore?.activeTopic.responseMode === 'faster'}
				on:click={() => changeResponseModeTo('faster')}
			>
				<span class="">Faster responses</span>
				<span class="text-xs">💨&nbsp;&nbsp;<span class="opacity-75">GPT 3.5 Turbo</span></span>
			</button>

			<button
				class="button flex flex-col items-start justify-start gap-1 rounded-lg text-left {$chatStore
					?.activeTopic.responseMode === 'better'
					? 'button-disabled !bg-primary-600/90 !text-white'
					: ''} {isChangingResponseMode ? 'button-loading' : ''}"
				type="button"
				disabled={isChangingResponseMode || $chatStore?.activeTopic.responseMode === 'better'}
				on:click={() => changeResponseModeTo('better')}
			>
				<span class="">Better responses</span>
				<span class="text-xs">✅&nbsp;&nbsp;<span class="opacity-75">GPT 4</span></span>
			</button>
		</div>
	</div>

	{#each messagesToShow as message, index (message.id)}
		<Message
			message={{
				...message,
				content:
					message.id === -1
						? `Typing${[...Array(typingDotCount)].map(() => '.').join('')}`
						: message.content,
			}}
			articleClassName={message.id === -1
				? '!animate-pulse !bg-transparent !bg-none !px-0 !text-primary-600/75 !shadow-none dark:!text-primary-300/75'
				: ''}
			isInContextWindow={messagesToShow.length - index - 1 < messagesCountInContext}
		/>
	{/each}
</ul>

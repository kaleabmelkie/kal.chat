<script lang="ts">
	import Message from '$lib/components/message.svelte'
	import { chatStore, type ChatStoreType } from '$lib/stores/chat-store'
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

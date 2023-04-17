<script lang="ts">
	import Message from '$lib/components/message.svelte'
	import type { PageData } from '../../routes/topic/[id]/$types'

	export let data: PageData
	export let isSendingMessage: boolean

	let typingDotCount = 0

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4
	}, 150)
</script>

<ul
	class="mx-auto flex min-h-full max-w-[56rem] flex-col gap-6 px-4 pb-[calc(4rem+7.25rem)] lg:px-6"
>
	<div class="min-h-[calc(4.75rem+3.5rem)] flex-1" />

	{#each data.topic.Message.filter((m) => m.role !== 'system') as message (message.id)}
		<Message {message} bind:data />
	{/each}

	{#if isSendingMessage}
		{#key 'Typing...'}
			<Message
				message={{
					id: -1,
					role: 'system',
					content: `Typing${[...Array(typingDotCount)].map(() => '.').join('')}`,
				}}
				articleClassName="!animate-pulse !bg-transparent !bg-none !px-0 !py-2 !text-primary-600/75 !shadow-none dark:!text-primary-300/75"
				bind:data
			/>
		{/key}
	{/if}
</ul>

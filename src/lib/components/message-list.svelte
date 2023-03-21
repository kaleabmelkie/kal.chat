<script lang="ts">
	import Message from '$lib/components/message.svelte'
	import { createEventDispatcher, onMount } from 'svelte'
	import type { PageData } from '../../routes/thread/[id]/$types'

	export let data: PageData
	export let loading: boolean

	const dispatch = createEventDispatcher<{
		scrollToBottom: undefined
	}>()

	onMount(() => {
		dispatch('scrollToBottom')
	})

	let typingDotCount = 0

	setInterval(() => {
		typingDotCount = (typingDotCount + 1) % 4
	}, 150)
</script>

<ul
	class="mx-auto flex min-h-full max-w-[56rem] flex-col gap-6 px-4 pb-[calc(4rem+7.25rem)] lg:px-6"
>
	<div class="min-h-[4.75rem] flex-1" />

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
				articleClassName="!animate-pulse !bg-transparent !bg-none !px-0 !text-blue-900 !shadow-none"
			/>
		{/key}
	{/if}
</ul>

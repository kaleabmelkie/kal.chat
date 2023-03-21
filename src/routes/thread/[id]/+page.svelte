<script lang="ts">
	import MessageForm from '$lib/components/message-form.svelte'
	import MessageList from '$lib/components/message-list.svelte'
	import { countTokens } from '$lib/utils/count-tokens'
	import { onMount, tick } from 'svelte'

	export let data

	onMount(() => {
		scrollToBottom()
	})

	let isSideOpen = false
	let loading = false
	let bottomEle: HTMLSpanElement | null = null
	let message = ''

	let tokensActive = 0
	$: countTokens(
		[...data.thread.Message.slice(-1 * data.contextLength).map((m) => m.content), message].join(
			' ',
		),
	).then((count) => (tokensActive = data.systemPromptTokensCount + count))

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
</script>

<svelte:head>
	<title>
		{data.thread.title
			? `Chat: ${data.thread.title} | kal.chat`
			: 'Chat | kal.chat — Better Chat Interface for GPT'}
	</title>
</svelte:head>

<div class="flex h-screen">
	{#if isSideOpen}
		<div class="h-screen w-[16rem] flex-shrink-0 overflow-auto bg-white/40">
			<h2 class="p-4 pt-[calc(4.75rem+1rem)] lg:px-6">
				// TODO: New Thread, Search, & Thread History Thread
			</h2>
		</div>
	{/if}
	<div class="relative h-screen flex-1 overflow-auto">
		<MessageList bind:data bind:loading on:scrollToBottom={scrollToBottom} />

		<MessageForm
			bind:data
			bind:isSideOpen
			bind:loading
			bind:message
			bind:tokensActive
			on:scrollToBottom={scrollToBottom}
		/>

		<div bind:this={bottomEle} />
	</div>
</div>

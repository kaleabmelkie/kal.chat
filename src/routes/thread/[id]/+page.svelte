<script lang="ts">
	import MessageForm from '$lib/components/message-form.svelte'
	import MessageList from '$lib/components/message-list.svelte'
	import { countTokens } from '$lib/utils/count-tokens'
	import { onMount, tick } from 'svelte'

	export let data

	onMount(() => {
		scrollToBottom()
	})

	let loading = false
	let bottomEle: HTMLSpanElement | null = null
	let message = ''

	let tokensActive = 0
	$: countTokens([...data.thread.Message.map((m) => m.content), message].join('')).then(
		(count) => (tokensActive = count),
	)

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

<div>
	<MessageList bind:data bind:loading on:scrollToBottom={scrollToBottom} />

	<MessageForm
		bind:data
		bind:loading
		bind:message
		bind:tokensActive
		on:scrollToBottom={scrollToBottom}
	/>

	<div bind:this={bottomEle} />
</div>

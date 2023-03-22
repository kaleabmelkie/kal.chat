<script lang="ts">
	import MessageForm from '$lib/components/message-form.svelte'
	import MessageList from '$lib/components/message-list.svelte'
	import SideBar from '$lib/components/side-bar.svelte'
	import ArrowRight from '$lib/icons/arrow-right.svg.svelte'
	import MenuSvg from '$lib/icons/menu.svg.svelte'
	import { countTokens } from '$lib/utils/count-tokens'
	import { smallScreenThresholdInPx } from '$lib/utils/small-screen-threshold-in-px'
	import { onMount, tick } from 'svelte'

	export let data

	onMount(() => {
		scrollToBottom()
		isSideBarOpen = innerWidth >= smallScreenThresholdInPx
	})

	let innerWidth = 0
	let innerHeight = 0
	let isSideBarOpen = false
	let isSendingMessage = false
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

<svelte:window bind:innerWidth bind:innerHeight />

<svelte:head>
	<title>
		{data.thread.title
			? `Chat: ${data.thread.title} | kal.chat`
			: 'Chat | kal.chat — Better Chat Interface for GPT'}
	</title>
</svelte:head>

<div class="flex h-screen">
	{#if isSideBarOpen}
		<SideBar
			bind:data
			bind:innerWidth
			bind:isOpen={isSideBarOpen}
			on:scrollToBottom={scrollToBottom}
		/>
	{:else}
		<button
			class="group absolute left-0 top-[4.75rem] z-30 flex h-14 w-36 transform-gpu items-center gap-2 rounded-r-full bg-white/75 p-4 text-blue-900 shadow-sm shadow-blue-600/10 transition-all hover:w-40 hover:bg-white/95 hover:text-blue-600 hover:shadow focus:w-44 focus:bg-white/95 focus:text-blue-600 focus:shadow active:bg-blue-500/5 active:shadow-none sm:backdrop-blur-sm lg:p-6 lg:backdrop-blur"
			type="button"
			on:click={() => (isSideBarOpen = true)}
		>
			<MenuSvg class="!h-5 !w-5 transition-all group-hover:opacity-0 group-focus:opacity-0" />
			<span class="flex-1 pr-1 text-center font-semibold transition-all"> Threads </span>
			<ArrowRight class="hidden !h-5 !w-5 transition-all group-hover:block group-focus:block" />
		</button>
	{/if}
	<div class="relative h-screen flex-1 overflow-auto">
		<MessageList bind:data bind:isSendingMessage on:scrollToBottom={scrollToBottom} />

		<MessageForm
			bind:data
			bind:innerWidth
			bind:innerHeight
			bind:isSideBarOpen
			bind:isSendingMessage
			bind:message
			bind:tokensActive
			on:scrollToBottom={scrollToBottom}
		/>

		<div bind:this={bottomEle} />
	</div>
</div>

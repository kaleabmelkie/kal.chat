<script lang="ts">
	import { page } from '$app/stores'
	import MessageBox from '$lib/components/message-box.svelte'
	import MessageList from '$lib/components/message-list.svelte'
	import SideBar from '$lib/components/side-bar.svelte'
	import ArrowRight from '$lib/icons/arrow-right.svg.svelte'
	import MenuSvg from '$lib/icons/clock.svg.svelte'
	import { smallScreenThresholdInPx } from '$lib/utils/constants'
	import { countTokens } from '$lib/utils/count-tokens'
	import { onMount, tick } from 'svelte'

	export let data

	onMount(() => {
		scrollToBottom()
		page.subscribe(() => {
			scrollToBottom()
		})

		if (data.user.prefersSideBarOpen) {
			isSideBarOpen = innerWidth >= smallScreenThresholdInPx
		}
	})

	let innerWidth = 0
	let innerHeight = 0
	let isSideBarOpen = data.user.prefersSideBarOpen
	let isSendingMessage = false
	let bottomEle: HTMLSpanElement | null = null
	let message = ''

	let tokensActive = 0
	$: countTokens(
		[...data.topic.Message.slice(-1 * data.contextLength).map((m) => m.content), message].join(' '),
	).then((count) => (tokensActive = data.systemPromptTokensCount + count))

	async function scrollToBottom(repeat = true) {
		if (!bottomEle) {
			return
		}
		bottomEle.scrollIntoView({ behavior: 'smooth' })
		await tick()
		if (repeat) {
			setTimeout(() => scrollToBottom(false), 150)
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<svelte:head>
	<title>
		{data.topic.title
			? `Chat: ${data.topic.title} | kal.chat`
			: 'Chat | kal.chat — Better Chat Interface for GPT'}
	</title>
</svelte:head>

<div class="flex h-screen">
	{#if isSideBarOpen}
		<SideBar bind:data bind:innerWidth bind:isOpen={isSideBarOpen} />
	{:else}
		<button
			class="group fixed left-0 top-[4.75rem] z-30 flex h-14 w-[4.5rem] transform-gpu items-center rounded-r-full bg-white/75 p-4 text-primary-900 shadow-sm shadow-primary-600/10 transition-all hover:w-36 hover:bg-white/95 hover:text-primary-600 hover:shadow focus:w-36 focus:bg-white/95 focus:text-primary-600 focus:shadow active:w-36 active:bg-primary-500/5 active:shadow-none sm:backdrop-blur-sm lg:pl-6 lg:backdrop-blur"
			type="button"
			on:click={async () => {
				isSideBarOpen = true
				if (innerWidth >= smallScreenThresholdInPx) {
					await fetch('/account/set-prefers-side-bar-open', {
						method: 'PUT',
						body: JSON.stringify({ prefersSideBarOpen: true }),
					})
				}
			}}
		>
			<MenuSvg class="block !h-5 !w-5 transition-all group-hover:hidden group-focus:hidden" />
			<span
				class="hidden flex-1 pr-1 text-center font-semibold transition-all group-hover:inline group-focus:inline"
			>
				Topics
			</span>
			<ArrowRight class="hidden !h-5 !w-5 transition-all group-hover:block group-focus:block" />
		</button>
	{/if}
	<div class="relative h-screen flex-1 overflow-auto">
		<MessageList bind:data bind:isSendingMessage />

		<MessageBox
			bind:data
			bind:innerWidth
			bind:innerHeight
			bind:isSideBarOpen
			bind:isSendingMessage
			bind:message
			bind:tokensActive
			on:scrollToBottom={() => scrollToBottom()}
		/>

		<div bind:this={bottomEle} />
	</div>
</div>
